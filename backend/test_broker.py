#!/usr/bin/env python3
import os

# Set environment BEFORE importing
os.environ['REDIS_HOST'] = 'communal-mullet-5499.upstash.io'
os.environ['REDIS_PORT'] = '6379'
os.environ['REDIS_PASSWORD'] = 'ARV7AAIjcDE3YzFhNmU3ZWVhYzU0ZDg4OTBlNzM4YzU1ZWFiNzI3Y3AxMA'
os.environ['REDIS_SSL'] = 'true'

import dramatiq
from dramatiq.brokers.redis import RedisBroker

print("Creating Redis broker...")

redis_broker = RedisBroker(
    host='communal-mullet-5499.upstash.io',
    port=6379,
    password='ARV7AAIjcDE3YzFhNmU3ZWVhYzU0ZDg4OTBlNzM4YzU1ZWFiNzI3Y3AxMA',
    ssl=True,
    ssl_cert_reqs=None
)

print(f"Broker created: {redis_broker}")

# Set the broker
dramatiq.set_broker(redis_broker)
print(f"Broker set in dramatiq: {dramatiq.get_broker()}")

# Create a simple actor
@dramatiq.actor
def test_task(message):
    print(f"Executing: {message}")

print("\nSending test message...")
try:
    result = test_task.send("Hello from test")
    print(f"Message sent: {result}")
except Exception as e:
    print(f"Error sending: {e}")
    import traceback
    traceback.print_exc()

# Check queue directly
print("\nChecking Redis directly...")
import redis
r = redis.from_url(
    "rediss://default:ARV7AAIjcDE3YzFhNmU3ZWVhYzU0ZDg4OTBlNzM4YzU1ZWFiNzI3Y3AxMA@communal-mullet-5499.upstash.io:6379",
    ssl_cert_reqs=None
)
length = r.llen("dramatiq:default")
print(f"Queue 'dramatiq:default' has {length} messages")