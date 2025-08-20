#!/usr/bin/env python3
"""
Test script for daily credits system
"""

import asyncio
from decimal import Decimal
from services.supabase import DBConnection
from services.daily_credits import (
    get_or_create_daily_credits,
    debit_daily_credits,
    get_daily_credits_summary,
    credits_to_dollars,
    dollars_to_credits
)
from services.billing import check_billing_status
from utils.logger import logger

async def test_daily_credits():
    """Test the daily credits system"""
    
    # Test user ID (you'll need to replace with a real user ID from your system)
    TEST_USER_ID = "29e38efa-512a-47c0-9130-0ca0cedeb533"  # Prophet Team user from the DB
    
    db = DBConnection()
    client = await db.client
    
    print("\n=== TESTING DAILY CREDITS SYSTEM ===\n")
    
    # Test 1: Get or create daily credits
    print("1. Getting/Creating daily credits...")
    daily_credits = await get_or_create_daily_credits(client, TEST_USER_ID)
    print(f"   Daily credits available: {daily_credits['credits_available']}")
    print(f"   Expires at: {daily_credits['expires_at']}")
    
    # Test 2: Get summary
    print("\n2. Getting daily credits summary...")
    summary = await get_daily_credits_summary(client, TEST_USER_ID)
    print(f"   Credits: {summary['daily_credits']}")
    print(f"   Used: {summary['daily_credits_used']}")
    print(f"   Expires in: {summary['daily_expires_in']}")
    
    # Test 3: Test conversion
    print("\n3. Testing conversions...")
    test_dollars = Decimal("1.50")
    test_credits = dollars_to_credits(test_dollars)
    print(f"   ${test_dollars} = {test_credits} credits")
    print(f"   {test_credits} credits = ${credits_to_dollars(test_credits)}")
    
    # Test 4: Debit some credits
    print("\n4. Testing debit...")
    test_cost = Decimal("0.10")  # $0.10 = 10 credits
    success, remaining = await debit_daily_credits(client, TEST_USER_ID, test_cost)
    print(f"   Attempted to debit ${test_cost} (10 credits)")
    print(f"   Success: {success}")
    print(f"   Remaining to charge: ${remaining}")
    
    # Test 5: Check new balance
    print("\n5. Checking new balance...")
    daily_credits = await get_or_create_daily_credits(client, TEST_USER_ID)
    print(f"   Daily credits available: {daily_credits['credits_available']}")
    
    # Test 6: Check billing status with daily credits
    print("\n6. Testing billing status check...")
    can_run, message, subscription = await check_billing_status(client, TEST_USER_ID)
    print(f"   Can run: {can_run}")
    print(f"   Message: {message}")
    if subscription:
        print(f"   Daily credits: {subscription.get('daily_credits', 'N/A')}")
        print(f"   Total credits available: {subscription.get('total_credits_available', 'N/A')}")
    
    print("\n=== TEST COMPLETE ===\n")

if __name__ == "__main__":
    asyncio.run(test_daily_credits())