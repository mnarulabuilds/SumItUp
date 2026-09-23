import re
from typing import Any

from bson import ObjectId

from app.database import get_db


async def fuzzy_search(user_id: str, query: str, content_type: str | None, limit: int) -> list[dict[str, Any]]:
    db = get_db()
    regex = re.compile(re.escape(query), re.IGNORECASE)
    mongo_filter: dict[str, Any] = {
        "userId": ObjectId(user_id),
        "$or": [
            {"title": regex},
            {"summary": regex},
            {"tags": regex},
        ],
    }
    if content_type:
        mongo_filter["contentType"] = content_type
    cursor = db.contents.find(mongo_filter).limit(limit)
    return [doc async for doc in cursor]


async def search_books(
    user_id: str,
    title: str | None,
    author: str | None,
    genre: str | None,
    limit: int,
) -> list[dict[str, Any]]:
    db = get_db()
    mongo_filter: dict[str, Any] = {"userId": ObjectId(user_id), "contentType": "book"}
    if title:
        mongo_filter["title"] = re.compile(re.escape(title), re.IGNORECASE)
    if author:
        mongo_filter["originalContent"] = re.compile(re.escape(author), re.IGNORECASE)
    if genre:
        mongo_filter["tags"] = re.compile(re.escape(genre), re.IGNORECASE)
    cursor = db.contents.find(mongo_filter).limit(limit)
    return [doc async for doc in cursor]
