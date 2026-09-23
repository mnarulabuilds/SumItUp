from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.dependencies import JwtUser, get_current_user
from app.repositories import users as user_repo
from app.database import get_db

router = APIRouter(prefix="/donations", tags=["donations"], dependencies=[Depends(get_current_user)])


class DonationBody(BaseModel):
    amountCents: int = Field(..., ge=100, le=100000)


@router.post("/")
async def create_donation(body: DonationBody, user: JwtUser = Depends(get_current_user)):
    db_user = await user_repo.find_by_id(user.id)
    if not db_user:
        raise HTTPException(status_code=404, detail={"error": "User not found"})
    balance = db_user.get("walletBalanceCents", 0)
    if body.amountCents > balance:
        raise HTTPException(status_code=402, detail={"error": "Insufficient wallet balance"})
    await user_repo.update_user(user.id, {"walletBalanceCents": balance - body.amountCents})
    doc = {
        "userId": db_user["_id"],
        "amountCents": body.amountCents,
        "createdAt": datetime.utcnow(),
    }
    result = await get_db().donations.insert_one(doc)
    doc["_id"] = result.inserted_id
    return {"message": "Donation recorded", "donation": doc}


@router.get("/mine")
async def my_donations(user: JwtUser = Depends(get_current_user)):
    from bson import ObjectId

    cursor = get_db().donations.find({"userId": ObjectId(user.id)}).sort("createdAt", -1)
    donations = [doc async for doc in cursor]
    return {"donations": donations}
