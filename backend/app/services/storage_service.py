"""Local-development and S3-compatible object storage."""
from __future__ import annotations

import asyncio
import io
import uuid
from pathlib import Path

from app.config import (
    STORAGE_BACKEND, S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY, S3_PUBLIC_BASE_URL,
)

STATIC_DIR = Path(__file__).resolve().parents[2] / "static" / "uploads"


def _s3_client():
    import boto3
    return boto3.client(
        "s3", endpoint_url=S3_ENDPOINT or None,
        aws_access_key_id=S3_ACCESS_KEY, aws_secret_access_key=S3_SECRET_KEY,
    )


async def save_bytes(content: bytes, *, folder: str, owner: str, extension: str, content_type: str) -> str:
    key = f"{folder}/{owner}-{uuid.uuid4().hex}{extension}"
    if STORAGE_BACKEND == "local":
        path = STATIC_DIR / key
        path.parent.mkdir(parents=True, exist_ok=True)
        await asyncio.to_thread(path.write_bytes, content)
        return f"/uploads/{key}"

    def upload():
        _s3_client().upload_fileobj(
            io.BytesIO(content), S3_BUCKET, key,
            ExtraArgs={"ContentType": content_type, "CacheControl": "public,max-age=31536000,immutable"},
        )

    await asyncio.to_thread(upload)
    return f"{S3_PUBLIC_BASE_URL}/{key}"
