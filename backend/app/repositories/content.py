from datetime import datetime
from typing import Any

from bson import ObjectId

from app.database import get_db

CONTENT_TYPES = ("audio", "image", "video", "gif", "url", "pdf", "book", "text")


async def create_content(data: dict[str, Any]) -> dict[str, Any]:
    now = datetime.utcnow()
    doc = {
        **data,
        "userId": ObjectId(data["userId"]),
        "tags": data.get("tags", []),
        "isFavorite": data.get("isFavorite", False),
        "isPublic": data.get("isPublic", False),
        "metadata": data.get("metadata", {}),
        "createdAt": now,
        "updatedAt": now,
    }
    result = await get_db().contents.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


async def find_by_user_id(user_id: str, options: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    options = options or {}
    query: dict[str, Any] = {"userId": ObjectId(user_id)}
    if options.get("contentType"):
        query["contentType"] = options["contentType"]
    if options.get("isFavorite") is not None:
        query["isFavorite"] = options["isFavorite"]
    cursor = (
        get_db()
        .contents.find(query)
        .skip(int(options.get("offset", 0)))
        .limit(int(options.get("limit", 10)))
        .sort("createdAt", -1)
    )
    return [doc async for doc in cursor]


async def find_by_id(content_id: str, user_id: str | None = None) -> dict[str, Any] | None:
    if not ObjectId.is_valid(content_id):
        return None
    query: dict[str, Any] = {"_id": ObjectId(content_id)}
    if user_id:
        query["userId"] = ObjectId(user_id)
    return await get_db().contents.find_one(query)


async def search_by_tags(user_id: str, tags: list[str]) -> list[dict[str, Any]]:
    cursor = get_db().contents.find({"userId": ObjectId(user_id), "tags": {"$in": tags}})
    return [doc async for doc in cursor]


async def update_content(content_id: str, updates: dict[str, Any]) -> dict[str, Any] | None:
    updates["updatedAt"] = datetime.utcnow()
    await get_db().contents.update_one({"_id": ObjectId(content_id)}, {"$set": updates})
    return await get_db().contents.find_one({"_id": ObjectId(content_id)})


async def delete_content(content_id: str, user_id: str) -> bool:
    result = await get_db().contents.delete_one(
        {"_id": ObjectId(content_id), "userId": ObjectId(user_id)}
    )
    return result.deleted_count > 0
