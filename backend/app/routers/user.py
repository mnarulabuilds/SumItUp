from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.dependencies import JwtUser, get_current_user
from app.repositories import preferences as pref_repo
from app.utils.mongo_json import serialize_mongo_doc

router = APIRouter(prefix="/user", tags=["user"], dependencies=[Depends(get_current_user)])


class PreferencesBody(BaseModel):
    defaultSummaryLength: str | None = None
    summaryStyle: str | None = None
    preferredLanguage: str | None = None
    processingQuality: str | None = None
    autoSaveContent: bool | None = None
    defaultPrivacy: str | None = None
    emailNotifications: bool | None = None
    processingNotifications: bool | None = None
    weeklyDigest: bool | None = None
    theme: str | None = None
    itemsPerPage: int | None = None
    favoriteContentTypes: list[str] | None = None
    interests: list[str] | None = None


class InterestsBody(BaseModel):
    interests: list[str]


@router.get("/preferences")
async def get_preferences(user: JwtUser = Depends(get_current_user)):
    try:
        prefs = await pref_repo.find_by_user_id(user.id)
        if not prefs:
            prefs = await pref_repo.create_default(user.id)
        return {"preferences": serialize_mongo_doc(prefs)}
    except Exception:
        raise HTTPException(status_code=500, detail={"error": "Failed to fetch preferences"}) from None


@router.put("/preferences")
async def update_preferences(body: PreferencesBody, user: JwtUser = Depends(get_current_user)):
    updates = body.model_dump(exclude_unset=True)
    prefs = await pref_repo.update_preferences(user.id, updates)
    return {"preferences": serialize_mongo_doc(prefs)}


@router.post("/preferences/reset")
async def reset_preferences(user: JwtUser = Depends(get_current_user)):
    prefs = await pref_repo.update_preferences(user.id, pref_repo.DEFAULT_PREFERENCES.copy())
    return {"preferences": serialize_mongo_doc(prefs)}


@router.post("/preferences/interests")
async def add_interests(body: InterestsBody, user: JwtUser = Depends(get_current_user)):
    if not body.interests:
        raise HTTPException(status_code=400, detail={"error": "Interests array is required"})
    prefs = await pref_repo.find_by_user_id(user.id) or await pref_repo.create_default(user.id)
    merged = list(set(prefs.get("interests", []) + body.interests))
    updated = await pref_repo.update_preferences(user.id, {"interests": merged})
    return {"preferences": serialize_mongo_doc(updated)}


@router.delete("/preferences/interests")
async def remove_interests(body: InterestsBody, user: JwtUser = Depends(get_current_user)):
    if not body.interests:
        raise HTTPException(status_code=400, detail={"error": "Interests array is required"})
    prefs = await pref_repo.find_by_user_id(user.id)
    if not prefs:
        raise HTTPException(status_code=404, detail={"error": "Preferences not found"})
    remaining = [i for i in prefs.get("interests", []) if i not in body.interests]
    updated = await pref_repo.update_preferences(user.id, {"interests": remaining})
    return {"preferences": serialize_mongo_doc(updated)}
