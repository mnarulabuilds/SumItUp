from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.cache_service import cache_service
from app.dependencies import JwtUser, get_current_user
from app.repositories import users as user_repo

router = APIRouter(prefix="/token", tags=["token"])


class EarnBody(BaseModel):
    adId: str


class SpendBody(BaseModel):
    tokens: int


@router.post("/earn")
async def earn_tokens(body: EarnBody, user: JwtUser = Depends(get_current_user)):
    if not body.adId:
        raise HTTPException(status_code=400, detail={"error": "Ad ID is required"})
    cached = cache_service.get(f"user:{user.id}")
    if not cached:
        db_user = await user_repo.find_by_id(user.id)
        if not db_user:
            raise HTTPException(status_code=404, detail={"error": "User not found"})
        cached = {"tokens": db_user.get("tokens", 0), "adEligible": db_user.get("adEligible", True)}
        cache_service.set(f"user:{user.id}", cached)
    if not cached.get("adEligible"):
        raise HTTPException(
            status_code=400,
            detail={"error": "User is not eligible for earning ads based tokens"},
        )
    cached["tokens"] = cached.get("tokens", 0) + 50
    await user_repo.update_user(user.id, {"tokens": cached["tokens"]})
    cache_service.set(f"user:{user.id}", cached)
    return {"message": "Tokens earned successfully", "tokens": cached["tokens"]}


@router.post("/spend")
async def spend_tokens(body: SpendBody, user: JwtUser = Depends(get_current_user)):
    if not body.tokens or body.tokens <= 0:
        raise HTTPException(status_code=400, detail={"error": "A positive number of tokens is required"})
    cached = cache_service.get(f"user:{user.id}")
    if not cached:
        db_user = await user_repo.find_by_id(user.id)
        if not db_user:
            raise HTTPException(status_code=404, detail={"error": "User not found"})
        cached = {"tokens": db_user.get("tokens", 0), "adEligible": db_user.get("adEligible", True)}
        cache_service.set(f"user:{user.id}", cached)
    if not cached.get("adEligible"):
        raise HTTPException(
            status_code=400,
            detail={"error": "User has already spent tokens and opted out of ads"},
        )
    if cached.get("tokens", 0) < body.tokens:
        raise HTTPException(status_code=400, detail={"error": "Insufficient tokens"})
    cached["tokens"] -= body.tokens
    cached["adEligible"] = False
    await user_repo.update_user(user.id, {"tokens": cached["tokens"], "adEligible": False})
    cache_service.set(f"user:{user.id}", cached)
    cache_service.set(f"adEligibility:{user.id}", False)
    return {"message": "Tokens spent successfully", "tokens": cached["tokens"]}
