from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.billing_plans import BILLING_PLANS
from app.dependencies import JwtUser, get_current_user
from app.repositories import users as user_repo

router = APIRouter(prefix="/billing", tags=["billing"], dependencies=[Depends(get_current_user)])


class SubscribeBody(BaseModel):
    planId: str


class TopUpBody(BaseModel):
    amountCents: int = Field(..., ge=100, le=50000)


@router.get("/plans")
async def list_plans():
    return {"plans": BILLING_PLANS}


@router.get("/wallet")
async def get_wallet(user: JwtUser = Depends(get_current_user)):
    db_user = await user_repo.find_by_id(user.id)
    if not db_user:
        raise HTTPException(status_code=404, detail={"error": "User not found"})
    return {
        "walletBalanceCents": db_user.get("walletBalanceCents", 0),
        "subscriptionPlan": db_user.get("subscriptionPlan", "free"),
        "subscriptionExpiresAt": db_user.get("subscriptionExpiresAt"),
    }


@router.post("/subscribe")
async def subscribe(body: SubscribeBody, user: JwtUser = Depends(get_current_user)):
    plan = next((p for p in BILLING_PLANS if p["id"] == body.planId), None)
    if not plan:
        raise HTTPException(status_code=400, detail={"error": "Invalid plan"})
    db_user = await user_repo.find_by_id(user.id)
    if not db_user:
        raise HTTPException(status_code=404, detail={"error": "User not found"})
    balance = db_user.get("walletBalanceCents", 0)
    price = plan["priceCents"]
    if price > balance:
        raise HTTPException(status_code=402, detail={"error": "Insufficient wallet balance"})
    await user_repo.update_user(
        user.id,
        {
            "walletBalanceCents": balance - price,
            "subscriptionPlan": plan["id"],
            "subscriptionExpiresAt": datetime.utcnow() + timedelta(days=30),
            "tokens": db_user.get("tokens", 0) + plan["tokensIncluded"],
        },
    )
    return {"message": "Subscription updated", "planId": plan["id"]}


@router.post("/wallet/top-up")
async def top_up_wallet(body: TopUpBody, user: JwtUser = Depends(get_current_user)):
    db_user = await user_repo.find_by_id(user.id)
    if not db_user:
        raise HTTPException(status_code=404, detail={"error": "User not found"})
    new_balance = db_user.get("walletBalanceCents", 0) + body.amountCents
    await user_repo.update_user(user.id, {"walletBalanceCents": new_balance})
    return {"walletBalanceCents": new_balance}
