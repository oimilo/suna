import redis.asyncio as redis
import os
from dotenv import load_dotenv
import asyncio
from utils.logger import logger
from typing import List, Any, Dict
from utils.retry import retry
import time
from collections import deque

# Redis client and connection pool
client: redis.Redis | None = None
pool: redis.ConnectionPool | None = None
_initialized = False
_init_lock = asyncio.Lock()

# PubSub connection management
_pubsub_pool: deque = deque(maxlen=20)  # Pool of reusable pubsub connections
_pubsub_active: Dict[int, tuple] = {}  # Track active connections (id -> (pubsub, last_used))
_pubsub_lock = asyncio.Lock()
MAX_PUBSUB_IDLE_TIME = 60  # Max idle time in seconds before cleanup

# Constants
REDIS_KEY_TTL = 3600 * 24  # 24 hour TTL as safety mechanism


def initialize():
    """Initialize Redis connection pool and client using environment variables."""
    global client, pool

    # Load environment variables if not already loaded
    load_dotenv()

    # Check for REDIS_URL first (for services like Upstash)
    redis_url = os.getenv("REDIS_URL")
    
    if redis_url:
        logger.info(f"Initializing Redis from URL: {redis_url[:20]}...")
        # For Upstash Redis with SSL
        import ssl
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        pool = redis.ConnectionPool.from_url(
            redis_url,
            decode_responses=True,
            socket_timeout=15.0,
            socket_connect_timeout=10.0,
            socket_keepalive=True,
            retry_on_timeout=True,
            health_check_interval=30,
            max_connections=128,
            ssl_cert_reqs=None,  # Disable cert verification for Upstash
        )
    else:
        # Fall back to individual configuration
        redis_host = os.getenv("REDIS_HOST", "redis")
        redis_port = int(os.getenv("REDIS_PORT", 6379))
        redis_password = os.getenv("REDIS_PASSWORD", "")
        
        # Connection pool configuration - optimized for production
        max_connections = 128            # Reasonable limit for production
        socket_timeout = 15.0            # 15 seconds socket timeout
        connect_timeout = 10.0           # 10 seconds connection timeout
        retry_on_timeout = not (os.getenv("REDIS_RETRY_ON_TIMEOUT", "True").lower() != "true")

        logger.info(f"Initializing Redis connection pool to {redis_host}:{redis_port} with max {max_connections} connections")

        # Create connection pool with production-optimized settings
        pool = redis.ConnectionPool(
            host=redis_host,
            port=redis_port,
            password=redis_password,
            decode_responses=True,
            socket_timeout=socket_timeout,
            socket_connect_timeout=connect_timeout,
            socket_keepalive=True,
            retry_on_timeout=retry_on_timeout,
            health_check_interval=30,
            max_connections=max_connections,
        )

    # Create Redis client from connection pool
    client = redis.Redis(connection_pool=pool)

    return client


async def initialize_async():
    """Initialize Redis connection asynchronously."""
    global client, _initialized

    async with _init_lock:
        if not _initialized:
            logger.info("Initializing Redis connection")
            initialize()

        try:
            # Test connection with timeout
            await asyncio.wait_for(client.ping(), timeout=5.0)
            logger.info("Successfully connected to Redis")
            _initialized = True
        except asyncio.TimeoutError:
            logger.error("Redis connection timeout during initialization")
            client = None
            _initialized = False
            raise ConnectionError("Redis connection timeout")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            client = None
            _initialized = False
            raise

    return client


async def close():
    """Close Redis connection and connection pool."""
    global client, pool, _initialized, _pubsub_pool, _pubsub_active
    
    # Close all pubsub connections first
    async with _pubsub_lock:
        # Close active connections
        for pubsub, _ in _pubsub_active.values():
            try:
                await asyncio.wait_for(pubsub.aclose(), timeout=1.0)
            except:
                pass
        _pubsub_active.clear()
        
        # Close pooled connections
        while _pubsub_pool:
            pubsub = _pubsub_pool.popleft()
            try:
                await asyncio.wait_for(pubsub.aclose(), timeout=1.0)
            except:
                pass
        
        logger.info("Closed all pubsub connections")
    
    if client:
        logger.info("Closing Redis connection")
        try:
            await asyncio.wait_for(client.aclose(), timeout=5.0)
        except asyncio.TimeoutError:
            logger.warning("Redis close timeout, forcing close")
        except Exception as e:
            logger.warning(f"Error closing Redis client: {e}")
        finally:
            client = None
    
    if pool:
        logger.info("Closing Redis connection pool")
        try:
            await asyncio.wait_for(pool.aclose(), timeout=5.0)
        except asyncio.TimeoutError:
            logger.warning("Redis pool close timeout, forcing close")
        except Exception as e:
            logger.warning(f"Error closing Redis pool: {e}")
        finally:
            pool = None
    
    _initialized = False
    logger.info("Redis connection and pool closed")


async def get_client():
    """Get the Redis client, initializing if necessary."""
    global client, _initialized
    if client is None or not _initialized:
        await retry(lambda: initialize_async())
    return client


# Basic Redis operations
async def set(key: str, value: str, ex: int = None, nx: bool = False):
    """Set a Redis key."""
    redis_client = await get_client()
    return await redis_client.set(key, value, ex=ex, nx=nx)


async def get(key: str, default: str = None):
    """Get a Redis key."""
    redis_client = await get_client()
    result = await redis_client.get(key)
    return result if result is not None else default


async def delete(key: str):
    """Delete a Redis key."""
    redis_client = await get_client()
    return await redis_client.delete(key)


async def publish(channel: str, message: str):
    """Publish a message to a Redis channel."""
    redis_client = await get_client()
    return await redis_client.publish(channel, message)


async def create_pubsub():
    """Create or reuse a Redis pubsub object from pool."""
    async with _pubsub_lock:
        # Try to reuse from pool
        while _pubsub_pool:
            pubsub = _pubsub_pool.popleft()
            try:
                # Test if connection is still alive
                await asyncio.wait_for(pubsub.ping(), timeout=1.0)
                _pubsub_active[id(pubsub)] = (pubsub, time.time())
                logger.debug(f"Reusing pubsub connection from pool. Active: {len(_pubsub_active)}, Pool: {len(_pubsub_pool)}")
                return pubsub
            except Exception:
                # Connection is dead, try next one
                try:
                    await pubsub.aclose()
                except:
                    pass
                continue
        
        # Create new connection if pool is empty or all connections were dead
        redis_client = await get_client()
        pubsub = redis_client.pubsub()
        _pubsub_active[id(pubsub)] = (pubsub, time.time())
        logger.debug(f"Created new pubsub connection. Active: {len(_pubsub_active)}, Pool: {len(_pubsub_pool)}")
        return pubsub

async def release_pubsub(pubsub):
    """Release a pubsub connection back to the pool for reuse."""
    if not pubsub:
        return
    
    async with _pubsub_lock:
        pubsub_id = id(pubsub)
        
        # Remove from active connections
        if pubsub_id in _pubsub_active:
            del _pubsub_active[pubsub_id]
        
        try:
            # Unsubscribe from all channels
            await pubsub.unsubscribe()
            
            # Test if connection is still healthy
            await asyncio.wait_for(pubsub.ping(), timeout=1.0)
            
            # Add back to pool if healthy and pool not full
            if len(_pubsub_pool) < _pubsub_pool.maxlen:
                _pubsub_pool.append(pubsub)
                logger.debug(f"Released pubsub to pool. Active: {len(_pubsub_active)}, Pool: {len(_pubsub_pool)}")
            else:
                # Pool is full, close the connection
                await pubsub.aclose()
                logger.debug(f"Closed excess pubsub connection. Active: {len(_pubsub_active)}, Pool: {len(_pubsub_pool)}")
        except Exception as e:
            # Connection is unhealthy, close it
            logger.debug(f"Closing unhealthy pubsub connection: {e}")
            try:
                await pubsub.aclose()
            except:
                pass

async def cleanup_idle_pubsubs():
    """Clean up idle pubsub connections periodically."""
    async with _pubsub_lock:
        current_time = time.time()
        to_remove = []
        
        # Check active connections for idle ones
        for pubsub_id, (pubsub, last_used) in _pubsub_active.items():
            if current_time - last_used > MAX_PUBSUB_IDLE_TIME:
                to_remove.append(pubsub_id)
        
        # Remove idle connections
        for pubsub_id in to_remove:
            pubsub, _ = _pubsub_active.pop(pubsub_id)
            try:
                await pubsub.aclose()
                logger.debug(f"Closed idle pubsub connection. Active: {len(_pubsub_active)}")
            except:
                pass


# List operations
async def rpush(key: str, *values: Any):
    """Append one or more values to a list."""
    redis_client = await get_client()
    return await redis_client.rpush(key, *values)


async def lrange(key: str, start: int, end: int) -> List[str]:
    """Get a range of elements from a list."""
    redis_client = await get_client()
    return await redis_client.lrange(key, start, end)


# Key management


async def keys(pattern: str) -> List[str]:
    redis_client = await get_client()
    return await redis_client.keys(pattern)


async def expire(key: str, seconds: int):
    redis_client = await get_client()
    return await redis_client.expire(key, seconds)
