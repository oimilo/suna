#!/usr/bin/env python3
"""
Parse Redis URL to get host, port and password
"""
from urllib.parse import urlparse
import os
from dotenv import load_dotenv

load_dotenv(".env.local")

redis_url = os.getenv('REDIS_URL')
print(f"REDIS_URL: {redis_url}")

if redis_url:
    parsed = urlparse(redis_url)
    print(f"\nParsed URL:")
    print(f"  Scheme: {parsed.scheme}")
    print(f"  Hostname: {parsed.hostname}")
    print(f"  Port: {parsed.port}")
    print(f"  Username: {parsed.username}")
    print(f"  Password: {parsed.password[:10]}..." if parsed.password else "  Password: None")
    
    print(f"\nVariáveis de ambiente para adicionar ao .env.local:")
    print(f"REDIS_HOST={parsed.hostname}")
    print(f"REDIS_PORT={parsed.port or 6379}")
    print(f"REDIS_PASSWORD={parsed.password}")
    print(f"REDIS_SSL=true")