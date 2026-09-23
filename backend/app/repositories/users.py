import secrets
from datetime import datetime, timedelta
from typing import Any

import bcrypt
from bson import ObjectId

from app.database import get_db


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=10)).decode()


def _check_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


async def find_by_email(email: str) -> dict[str, Any] | None:
    return await get_db().users.find_one({"email": email})


async def find_by_id(user_id: str) -> dict[str, Any] | None:
    if not ObjectId.is_valid(user_id):
        return None
    return await get_db().users.find_one({"_id": ObjectId(user_id)})


async def create_user(username: str, email: str, password: str) -> dict[str, Any]:
    doc = {
        "username": username,
        "email": email,
        "password": _hash_password(password),
        "tokens": 0,
        "walletBalanceCents": 0,
        "subscriptionPlan": "free",
        "adEligible": True,
        "verified": False,
    }
    result = await get_db().users.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


async def compare_password(user: dict[str, Any], candidate: str) -> bool:
    return _check_password(candidate, user["password"])


async def update_user(user_id: str, updates: dict[str, Any]) -> None:
    await get_db().users.update_one({"_id": ObjectId(user_id)}, {"$set": updates})


def generate_reset_token() -> tuple[str, datetime]:
    token = secrets.token_hex(32)
    expiry = datetime.utcnow() + timedelta(hours=1)
    return token, expiry


def generate_verification_token() -> str:
    return secrets.token_hex(32)


def validate_reset_token(user: dict[str, Any], token: str) -> bool:
    if user.get("resetToken") != token:
        return False
    expiry = user.get("resetTokenExpiry")
    if not expiry:
        return False
    if isinstance(expiry, datetime) and expiry <= datetime.utcnow():
        return False
    return True
