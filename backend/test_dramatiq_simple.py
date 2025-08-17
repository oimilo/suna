#!/usr/bin/env python3
import os
import sys

# Set environment variables BEFORE importing
os.environ['REDIS_HOST'] = 'communal-mullet-5499.upstash.io'
os.environ['REDIS_PORT'] = '6379'
os.environ['REDIS_PASSWORD'] = 'ARV7AAIjcDE3YzFhNmU3ZWVhYzU0ZDg4OTBlNzM4YzU1ZWFiNzI3Y3AxMA'
os.environ['REDIS_SSL'] = 'true'

print("Environment vars set:")
print(f"  REDIS_HOST: {os.getenv('REDIS_HOST')}")
print(f"  REDIS_PORT: {os.getenv('REDIS_PORT')}")
print(f"  REDIS_PASSWORD: {os.getenv('REDIS_PASSWORD')[:10]}...")
print(f"  REDIS_SSL: {os.getenv('REDIS_SSL')}")
print()

# Now import the module
print("Importing run_agent_background...")
try:
    from run_agent_background import check_health
    print("✓ Import successful")
    
    # Try to send a message
    print("\nSending test message...")
    result = check_health.send(key="test_key")
    print(f"✓ Message sent: {result}")
    
    # Check the queue
    import redis
    r = redis.from_url(
        "rediss://default:ARV7AAIjcDE3YzFhNmU3ZWVhYzU0ZDg4OTBlNzM4YzU1ZWFiNzI3Y3AxMA@communal-mullet-5499.upstash.io:6379",
        ssl_cert_reqs=None
    )
    
    print("\nChecking queue...")
    length = r.llen("dramatiq:default")
    print(f"Queue length: {length}")
    
    if length > 0:
        msg = r.lindex("dramatiq:default", 0)
        print(f"First message: {msg[:100]}...")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()