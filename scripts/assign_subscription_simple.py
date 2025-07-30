#!/usr/bin/env python3
"""
Simple script to manually assign a subscription to a user using Stripe API.
This creates a real Stripe subscription but with a 100% discount coupon.
Usage: python assign_subscription_simple.py <user_email> <price_id> [months]
"""

import sys
import os
import stripe
from datetime import datetime, timezone, timedelta

# Add backend directory to path
backend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backend')
sys.path.insert(0, backend_path)

# Load environment variables
from dotenv import load_dotenv
env_path = os.path.join(backend_path, '.env.local')
load_dotenv(env_path)

# Import after loading env
from utils.config import config

# Available price IDs
PRICE_IDS = {
    'pro': 'price_1RqK0hFNfWjTbEjsaAFuY7Cb',  # R$99/month
    'pro_yearly': 'price_1RqK0hFNfWjTbEjsN9XCGLA4',  # R$990/year
    'pro_max': 'price_1RqK4xFNfWjTbEjsCrjfvJVL',  # R$249/month
    'pro_max_yearly': 'price_1RqK6cFNfWjTbEjs75UPIgif',  # R$2490/year
    'free': 'price_1RILb4G6l1KZGqIrK4QLrx9i',  # Free tier
}

def assign_subscription_via_stripe(user_email: str, price_id: str, months: int = 1):
    """Create a real Stripe subscription with 100% discount."""
    # Initialize Stripe
    stripe.api_key = config.STRIPE_SECRET_KEY
    
    try:
        # Search for existing customer by email
        customers = stripe.Customer.list(email=user_email, limit=1)
        
        if customers.data:
            customer = customers.data[0]
            print(f"✓ Found existing Stripe customer: {customer.id}")
        else:
            # Create new customer
            customer = stripe.Customer.create(
                email=user_email,
                metadata={"manual_assignment": "true"}
            )
            print(f"✓ Created new Stripe customer: {customer.id}")
        
        # Create a 100% off coupon valid for X months
        coupon = stripe.Coupon.create(
            percent_off=100,
            duration="repeating",
            duration_in_months=months,
            name=f"Manual assignment for {user_email}",
            metadata={"manual_assignment": "true"}
        )
        print(f"✓ Created 100% discount coupon: {coupon.id}")
        
        # Check for existing subscriptions
        subscriptions = stripe.Subscription.list(
            customer=customer.id,
            price=price_id,
            status="active",
            limit=1
        )
        
        if subscriptions.data:
            print(f"⚠️  Customer already has an active subscription for this plan")
            subscription = subscriptions.data[0]
        else:
            # Create subscription with the coupon using discounts parameter
            subscription = stripe.Subscription.create(
                customer=customer.id,
                items=[{"price": price_id}],
                discounts=[{"coupon": coupon.id}],
                metadata={
                    "manual_assignment": "true",
                    "assigned_at": datetime.now(timezone.utc).isoformat()
                }
            )
            print(f"✓ Created subscription: {subscription.id}")
        
        # Get price details
        price = stripe.Price.retrieve(price_id)
        product = stripe.Product.retrieve(price.product)
        
        print(f"\n✅ Successfully assigned subscription!")
        print(f"   User: {user_email}")
        print(f"   Customer ID: {customer.id}")
        print(f"   Subscription ID: {subscription.id}")
        print(f"   Plan: {product.name} ({price_id})")
        print(f"   Status: {subscription.status}")
        print(f"   Free for: {months} month(s)")
        print(f"   Current period ends: {datetime.fromtimestamp(subscription['current_period_end'], tz=timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
        
        return True
        
    except stripe.error.StripeError as e:
        print(f"❌ Stripe error: {str(e)}")
        return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def main():
    if len(sys.argv) < 3:
        print("Usage: python assign_subscription_simple.py <user_email> <price_id|plan_name> [months]")
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
    
    # Run the function
    assign_subscription_via_stripe(user_email, price_id, months)

if __name__ == "__main__":
    main()