"""
Adicione estes logs temporários para diagnosticar o streaming
"""

# Em agent/api.py, linha ~847
import time
start_redis = time.time()
new_responses_json = await redis.lrange(response_list_key, new_start_index, -1)
redis_time = (time.time() - start_redis) * 1000
logger.info(f"[STREAMING DEBUG] Redis LRANGE took {redis_time:.0f}ms for {len(new_responses_json)} items")

# Em response_processor.py, onde processa chunks
if chunk_content:
    logger.info(f"[STREAMING DEBUG] Chunk size: {len(chunk_content)} chars")
    
# Em run_agent_background_simple.py, linha ~71
async for response in agent_gen:
    logger.info(f"[STREAMING DEBUG] Response type: {response.get('type')}, size: {len(str(response))}")