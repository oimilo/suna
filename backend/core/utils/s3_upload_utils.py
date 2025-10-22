"""
Utility functions for handling image operations.
"""

import base64
import uuid
from datetime import datetime
from typing import Iterable, Optional
from core.utils.logger import logger
from core.services.supabase import DBConnection
from core.utils.config import config


async def ensure_bucket_exists(client, bucket_name: str, *, public: bool = True, allowed_mime_types: Optional[Iterable[str]] = None, file_size_limit: Optional[int] = None) -> None:
    """
    Ensure that a Supabase storage bucket exists before attempting uploads.
    Creates the bucket on the fly when it is missing (common on new environments).
    """
    try:
        buckets = await client.storage.list_buckets()
        bucket_ids = set()
        for bucket in buckets:
            if isinstance(bucket, dict):
                bucket_id = bucket.get("id") or bucket.get("name")
            else:
                bucket_id = getattr(bucket, "id", None) or getattr(bucket, "name", None)
            if bucket_id:
                bucket_ids.add(bucket_id)

        if bucket_name not in bucket_ids:
            options = {"public": public}
            if allowed_mime_types is not None:
                options["allowed_mime_types"] = list(allowed_mime_types)
            if file_size_limit is not None:
                options["file_size_limit"] = file_size_limit
            await client.storage.create_bucket(bucket_name, options)
            logger.info(f"Created missing Supabase bucket '{bucket_name}' with options {options}")
    except Exception as bucket_error:
        # Do not fail uploads if bucket creation check fails; surface warning instead.
        logger.warning(f"Unable to verify/create Supabase bucket '{bucket_name}': {bucket_error}")


async def upload_base64_image(base64_data: str, bucket_name: Optional[str] = None) -> str:
    """Upload a base64 encoded image to Supabase storage and return the URL.
    
    Args:
        base64_data (str): Base64 encoded image data (with or without data URL prefix)
        bucket_name (str): Name of the storage bucket to upload to
        
    Returns:
        str: Public URL of the uploaded image
    """
    try:
        # Remove data URL prefix if present
        if base64_data.startswith('data:'):
            base64_data = base64_data.split(',')[1]
        
        # Decode base64 data
        image_data = base64.b64decode(base64_data)
        
        # Generate unique filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_id = str(uuid.uuid4())[:8]
        filename = f"image_{timestamp}_{unique_id}.png"
        target_bucket = bucket_name or config.SUPABASE_PUBLIC_IMAGE_BUCKET
        
        # Upload to Supabase storage
        db = DBConnection()
        client = await db.client
        await ensure_bucket_exists(client, target_bucket, public=True)
        await client.storage.from_(target_bucket).upload(
            filename,
            image_data,
            {"content-type": "image/png"}
        )
        
        # Get public URL
        public_url = await client.storage.from_(target_bucket).get_public_url(filename)
        
        logger.debug(f"Successfully uploaded image to {public_url}")
        return public_url
        
    except Exception as e:
        logger.error(f"Error uploading base64 image: {e}")
        raise RuntimeError(f"Failed to upload image: {str(e)}")

async def upload_image_bytes(image_bytes: bytes, content_type: str = "image/png", bucket_name: Optional[str] = None) -> str:
    try:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_id = str(uuid.uuid4())[:8]
        ext = "png"
        if content_type == "image/jpeg" or content_type == "image/jpg":
            ext = "jpg"
        elif content_type == "image/webp":
            ext = "webp"
        elif content_type == "image/gif":
            ext = "gif"
        filename = f"agent_profile_{timestamp}_{unique_id}.{ext}"

        db = DBConnection()
        client = await db.client
        target_bucket = bucket_name or config.SUPABASE_AGENT_PROFILE_BUCKET
        await ensure_bucket_exists(
            client,
            target_bucket,
            public=True,
            allowed_mime_types=['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
            file_size_limit=5 * 1024 * 1024,
        )
        await client.storage.from_(target_bucket).upload(
            filename,
            image_bytes,
            {"content-type": content_type}
        )

        public_url = await client.storage.from_(target_bucket).get_public_url(filename)
        logger.debug(f"Successfully uploaded agent profile image to {public_url}")
        return public_url
    except Exception as e:
        logger.error(f"Error uploading image bytes: {e}")
        raise RuntimeError(f"Failed to upload image: {str(e)}")
