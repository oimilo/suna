"""
Admin endpoints for manual billing management.
Only accessible by admin users.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from datetime import datetime, timezone, timedelta
from services.supabase import DBConnection
from utils.auth_utils import get_current_user_id_from_jwt
from pydantic import BaseModel
from utils.logger import logger
import uuid

router = APIRouter(prefix="/admin/billing", tags=["admin-billing"])

class AssignSubscriptionRequest(BaseModel):
    user_id: str
    price_id: str
    months: int = 1
    reason: Optional[str] = None

async def verify_admin(current_user_id: str = Depends(get_current_user_id_from_jwt)):
    """Verify that the current user is an admin."""
    # TODO: Implement proper admin check
    # For now, you can hardcode admin emails or check a database field
    ADMIN_EMAILS = ["admin@oimilo.com"]  # Add your admin emails here
    
    db = DBConnection()
    client = await db.client
    
    # Get user details
    user_result = await client.auth.admin.get_user_by_id(current_user_id)
    if not user_result or user_result.user.email not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return current_user_id

@router.post("/assign-subscription")
async def assign_subscription_manually(
    request: AssignSubscriptionRequest,
    admin_id: str = Depends(verify_admin)
):
    """
    Manually assign a subscription plan to a user without payment.
    This creates a mock customer and subscription in the database.
    """
    try:
        db = DBConnection()
        client = await db.client
        
        # Get user details
        user_result = await client.auth.admin.get_user_by_id(request.user_id)
        if not user_result:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_email = user_result.user.email
        
        # Check if customer already exists
        customer_result = await client.schema('basejump').from_('billing_customers') \
            .select('id') \
            .eq('account_id', request.user_id) \
            .execute()
        
        if customer_result.data and len(customer_result.data) > 0:
            customer_id = customer_result.data[0]['id']
        else:
            # Create a manual customer ID (not a real Stripe customer)
            customer_id = f"cus_manual_{uuid.uuid4().hex[:14]}"
            
            # Insert customer record
            await client.schema('basejump').from_('billing_customers').insert({
                'id': customer_id,
                'account_id': request.user_id,
                'email': user_email,
                'provider': 'stripe',
                'active': True
            }).execute()
            
            logger.info(f"Created manual customer {customer_id} for user {request.user_id}")
        
        # Create or update subscription
        subscription_id = f"sub_manual_{uuid.uuid4().hex[:20]}"
        current_time = datetime.now(timezone.utc)
        period_end = current_time + timedelta(days=30 * request.months)
        
        # Check if there's an existing subscription
        existing_sub = await client.schema('basejump').from_('billing_subscriptions') \
            .select('*') \
            .eq('customer_id', customer_id) \
            .execute()
        
        subscription_data = {
            'id': subscription_id,
            'customer_id': customer_id,
            'status': 'active',
            'price_id': request.price_id,
            'quantity': 1,
            'current_period_start': current_time.isoformat(),
            'current_period_end': period_end.isoformat(),
            'cancel_at_period_end': False,
            'metadata': {
                'manual_assignment': True,
                'assigned_by': admin_id,
                'assigned_at': current_time.isoformat(),
                'reason': request.reason or 'Manual assignment by admin'
            }
        }
        
        if existing_sub.data and len(existing_sub.data) > 0:
            # Update existing subscription
            await client.schema('basejump').from_('billing_subscriptions') \
                .update(subscription_data) \
                .eq('customer_id', customer_id) \
                .execute()
            logger.info(f"Updated subscription for customer {customer_id}")
        else:
            # Insert new subscription
            await client.schema('basejump').from_('billing_subscriptions') \
                .insert(subscription_data) \
                .execute()
            logger.info(f"Created subscription {subscription_id} for customer {customer_id}")
        
        # Update customer active status
        await client.schema('basejump').from_('billing_customers') \
            .update({'active': True}) \
            .eq('id', customer_id) \
            .execute()
        
        return {
            "success": True,
            "message": f"Subscription assigned successfully to {user_email}",
            "details": {
                "user_id": request.user_id,
                "customer_id": customer_id,
                "subscription_id": subscription_id,
                "price_id": request.price_id,
                "valid_until": period_end.isoformat(),
                "months": request.months
            }
        }
        
    except Exception as e:
        logger.error(f"Error assigning subscription: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list-manual-subscriptions")
async def list_manual_subscriptions(
    admin_id: str = Depends(verify_admin)
):
    """List all manually assigned subscriptions."""
    try:
        db = DBConnection()
        client = await db.client
        
        # Get all subscriptions with manual_assignment metadata
        result = await client.schema('basejump').from_('billing_subscriptions') \
            .select('*, billing_customers(email, account_id)') \
            .filter('metadata->>manual_assignment', 'eq', 'true') \
            .execute()
        
        subscriptions = []
        for sub in result.data:
            subscriptions.append({
                "subscription_id": sub['id'],
                "user_email": sub['billing_customers']['email'] if sub.get('billing_customers') else None,
                "user_id": sub['billing_customers']['account_id'] if sub.get('billing_customers') else None,
                "price_id": sub['price_id'],
                "status": sub['status'],
                "valid_until": sub['current_period_end'],
                "assigned_by": sub['metadata'].get('assigned_by'),
                "assigned_at": sub['metadata'].get('assigned_at'),
                "reason": sub['metadata'].get('reason')
            })
        
        return {
            "total": len(subscriptions),
            "subscriptions": subscriptions
        }
        
    except Exception as e:
        logger.error(f"Error listing manual subscriptions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/revoke-subscription/{user_id}")
async def revoke_manual_subscription(
    user_id: str,
    admin_id: str = Depends(verify_admin)
):
    """Revoke a manually assigned subscription."""
    try:
        db = DBConnection()
        client = await db.client
        
        # Get customer ID
        customer_result = await client.schema('basejump').from_('billing_customers') \
            .select('id') \
            .eq('account_id', user_id) \
            .execute()
        
        if not customer_result.data:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        customer_id = customer_result.data[0]['id']
        
        # Delete subscription
        await client.schema('basejump').from_('billing_subscriptions') \
            .delete() \
            .eq('customer_id', customer_id) \
            .execute()
        
        # Update customer status
        await client.schema('basejump').from_('billing_customers') \
            .update({'active': False}) \
            .eq('id', customer_id) \
            .execute()
        
        logger.info(f"Revoked subscription for user {user_id}")
        
        return {
            "success": True,
            "message": f"Subscription revoked for user {user_id}"
        }
        
    except Exception as e:
        logger.error(f"Error revoking subscription: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))