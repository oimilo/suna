#!/usr/bin/env python3
"""
Script to manually assign a subscription to a user.
Usage: python assign_subscription.py <user_email> <price_id> [months]
"""

import sys
import os
import asyncio
from datetime import datetime, timezone, timedelta
import uuid

# Add backend directory to path
backend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backend')
sys.path.insert(0, backend_path)

# Load environment variables from backend/.env.local
from dotenv import load_dotenv
env_path = os.path.join(backend_path, '.env.local')
load_dotenv(env_path)

from services.supabase import DBConnection
from utils.logger import logger

# Available price IDs
PRICE_IDS = {
    'pro': 'price_1RqK0hFNfWjTbEjsaAFuY7Cb',  # R$99/month
    'pro_yearly': 'price_1RqK0hFNfWjTbEjsN9XCGLA4',  # R$990/year
    'pro_max': 'price_1RqK4xFNfWjTbEjsCrjfvJVL',  # R$249/month
    'pro_max_yearly': 'price_1RqK6cFNfWjTbEjs75UPIgif',  # R$2490/year
    'free': 'price_1RILb4G6l1KZGqIrK4QLrx9i',  # Free tier
}

async def assign_subscription(user_email: str, price_id: str, months: int = 1):
    """Assign a subscription to a user by email."""
    try:
        db = DBConnection()
        client = await db.client
        
        # Get user by email using admin API
        users = await client.auth.admin.list_users()
        user = None
        for u in users:
            if u.email == user_email:
                user = u
                break
        
        if not user:
            print(f"❌ User not found: {user_email}")
            return False
        
        user_id = user.id
        
        # Check if customer exists
        customer_result = await client.schema('basejump').from_('billing_customers') \
            .select('id') \
            .eq('account_id', user_id) \
            .execute()
        
        if customer_result.data:
            customer_id = customer_result.data[0]['id']
            print(f"✓ Found existing customer: {customer_id}")
        else:
            # Create manual customer
            customer_id = f"cus_manual_{uuid.uuid4().hex[:14]}"
            await client.schema('basejump').from_('billing_customers').insert({
                'id': customer_id,
                'account_id': user_id,
                'email': user_email,
                'provider': 'stripe',
                'active': True
            }).execute()
            print(f"✓ Created customer: {customer_id}")
        
        # Create subscription
        subscription_id = f"sub_manual_{uuid.uuid4().hex[:20]}"
        current_time = datetime.now(timezone.utc)
        period_end = current_time + timedelta(days=30 * months)
        
        # Check for existing subscription
        existing_sub = await client.schema('basejump').from_('billing_subscriptions') \
            .select('*') \
            .eq('customer_id', customer_id) \
            .execute()
        
        subscription_data = {
            'id': subscription_id,
            'customer_id': customer_id,
            'status': 'active',
            'price_id': price_id,
            'quantity': 1,
            'current_period_start': current_time.isoformat(),
            'current_period_end': period_end.isoformat(),
            'cancel_at_period_end': False,
            'metadata': {
                'manual_assignment': True,
                'assigned_at': current_time.isoformat(),
                'reason': 'Manual CLI assignment'
            }
        }
        
        if existing_sub.data:
            # Update existing
            await client.schema('basejump').from_('billing_subscriptions') \
                .update(subscription_data) \
                .eq('customer_id', customer_id) \
                .execute()
            print(f"✓ Updated existing subscription")
        else:
            # Create new
            await client.schema('basejump').from_('billing_subscriptions') \
                .insert(subscription_data) \
                .execute()
            print(f"✓ Created subscription: {subscription_id}")
        
        # Update customer active status
        await client.schema('basejump').from_('billing_customers') \
            .update({'active': True}) \
            .eq('id', customer_id) \
            .execute()
        
        print(f"\n✅ Successfully assigned subscription!")
        print(f"   User: {user_email}")
        print(f"   Plan: {price_id}")
        print(f"   Valid until: {period_end.strftime('%Y-%m-%d %H:%M:%S UTC')}")
        print(f"   Duration: {months} month(s)")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        logger.error(f"Error assigning subscription: {str(e)}")
        return False

def main():
    if len(sys.argv) < 3:
        print("Usage: python assign_subscription.py <user_email> <price_id|plan_name> [months]")
        print("\nAvailable plans:")
        for name, price_id in PRICE_IDS.items():
            print(f"  {name}: {price_id}")
        sys.exit(1)
    
    user_email = sys.argv[1]
    price_input = sys.argv[2]
    months = int(sys.argv[3]) if len(sys.argv) > 3 else 1
    
    # Check if price_input is a plan name or price ID
    if price_input in PRICE_IDS:
        price_id = PRICE_IDS[price_input]
        print(f"Using plan: {price_input} ({price_id})")
    else:
        price_id = price_input
    
    # Run the async function
    asyncio.run(assign_subscription(user_email, price_id, months))

if __name__ == "__main__":
    main()