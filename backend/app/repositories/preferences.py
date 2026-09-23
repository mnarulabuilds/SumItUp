from datetime import datetime
from typing import Any

from bson import ObjectId

from app.database import get_db

DEFAULT_PREFERENCES = {
    "defaultSummaryLength": "medium",
    "summaryStyle": "paragraph",
    "preferredLanguage": "en",
    "processingQuality": "balanced",
    "autoSaveContent": True,
    "defaultPrivacy": "private",
    "emailNotifications": True,
    "processingNotifications": True,
    "weeklyDigest": False,
    "theme": "auto",
    "itemsPerPage": 10,
    "favoriteContentTypes": [],
    "interests": [],
}


async def find_by_user_id(user_id: str) -> dict[str, Any] | None:
    return await get_db().userpreferences.find_one({"userId": ObjectId(user_id)})


async def create_default(user_id: str) -> dict[str, Any]:
    now = datetime.utcnow()
    doc = {"userId": ObjectId(user_id), **DEFAULT_PREFERENCES, "createdAt": now, "updatedAt": now}
    result = await get_db().userpreferences.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


async def update_preferences(user_id: str, updates: dict[str, Any]) -> dict[str, Any]:
    allowed = set(DEFAULT_PREFERENCES.keys())
    filtered = {k: v for k, v in updates.items() if k in allowed and v is not None}
    filtered["updatedAt"] = datetime.utcnow()
    await get_db().userpreferences.update_one(
        {"userId": ObjectId(user_id)},
        {"$set": filtered},
        upsert=True,
    )
    doc = await find_by_user_id(user_id)
    return doc or await create_default(user_id)
