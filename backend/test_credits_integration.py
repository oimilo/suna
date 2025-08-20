#!/usr/bin/env python3
"""
Test if daily credits are being properly debited
"""

import asyncio
from decimal import Decimal
from services.supabase import DBConnection
from services.daily_credits import get_or_create_daily_credits, debit_daily_credits
from services.billing_credits import register_usage_with_credits
from utils.logger import logger

async def test_credits():
    """Test the daily credits debit system"""
    
    # Your user ID
    TEST_USER_ID = "29e38efa-512a-47c0-9130-0ca0cedeb533"
    
    db = DBConnection()
    client = await db.client
    
    print("\n=== TESTING DAILY CREDITS DEBIT ===\n")
    
    # Get current daily credits
    print("1. Current daily credits status:")
    daily_credits = await get_or_create_daily_credits(client, TEST_USER_ID)
    print(f"   Credits available: {daily_credits['credits_available']}")
    print(f"   Credits used: {daily_credits['credits_used']}")
    
    # Test small debit (should use daily credits)
    print("\n2. Testing small debit ($0.08 = 8 credits)...")
    test_cost = 0.08  # $0.08 = 8 credits
    daily_used, sub_used = await register_usage_with_credits(client, TEST_USER_ID, test_cost)
    print(f"   Daily credits used: ${daily_used:.4f}")
    print(f"   Subscription used: ${sub_used:.4f}")
    
    # Check new balance
    print("\n3. New daily credits status:")
    daily_credits = await get_or_create_daily_credits(client, TEST_USER_ID)
    print(f"   Credits available: {daily_credits['credits_available']}")
    print(f"   Credits used: {daily_credits['credits_used']}")
    
    print("\n=== TEST COMPLETE ===\n")

if __name__ == "__main__":
    asyncio.run(test_credits())