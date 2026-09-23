from fastapi import APIRouter, Depends, HTTPException

from app.cache_service import cache_service
from app.dependencies import JwtUser, get_current_user
from app.repositories import users as user_repo

router = APIRouter(prefix="/ad", tags=["ad"])


@router.get("/check-eligibility")
async def check_ad_eligibility(user: JwtUser = Depends(get_current_user)):
    cached = cache_service.get(f"adEligibility:{user.id}")
    if cached is None:
        db_user = await user_repo.find_by_id(user.id)
        if not db_user:
            raise HTTPException(status_code=404, detail={"error": "User not found"})
        cached = db_user.get("adEligible", True)
        cache_service.set(f"adEligibility:{user.id}", cached)
    return {"eligible": cached}
