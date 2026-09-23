import re

import jwt
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, EmailStr

from app.config import JWT_SECRET
from app.dependencies import JwtUser, get_current_user
from app.repositories import users as user_repo
from app.services import auth_email

router = APIRouter(prefix="/auth", tags=["auth"])

PASSWORD_REGEX = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$")


class LoginBody(BaseModel):
    email: EmailStr | str
    password: str


class SignupBody(BaseModel):
    username: str
    email: EmailStr | str
    password: str


class EmailBody(BaseModel):
    email: EmailStr | str


class ResetPasswordBody(BaseModel):
    token: str
    password: str


@router.post("/login")
async def login(body: LoginBody):
    if not body.email or not body.password:
        raise HTTPException(status_code=400, detail={"error": "Email and password are required"})
    user = await user_repo.find_by_email(str(body.email))
    if not user:
        raise HTTPException(status_code=401, detail={"error": "User not found"})
    if not await user_repo.compare_password(user, body.password):
        raise HTTPException(status_code=401, detail={"error": "Invalid credentials"})
    if not JWT_SECRET:
        raise HTTPException(status_code=500, detail={"error": "JWT secret not configured"})
    token = jwt.encode({"id": str(user["_id"])}, JWT_SECRET, algorithm="HS256")
    return {"token": token}


@router.post("/signup")
async def signup(body: SignupBody):
    if not body.username or not body.email or not body.password:
        raise HTTPException(
            status_code=400,
            detail={"error": "Username, Email, and password are required"},
        )
    if not re.match(r"\S+@\S+\.\S+", str(body.email)):
        raise HTTPException(status_code=400, detail={"error": "Invalid email format"})
    if not PASSWORD_REGEX.match(body.password):
        raise HTTPException(
            status_code=400,
            detail={
                "error": (
                    "Password must be at least 8 characters long and contain at least one "
                    "uppercase letter, one lowercase letter, one number, and one special character "
                    "(!@#$%^&*)"
                )
            },
        )
    existing = await user_repo.find_by_email(str(body.email))
    if existing:
        raise HTTPException(status_code=409, detail={"error": "User already exists"})
    try:
        await user_repo.create_user(body.username, str(body.email), body.password)
        return {"message": "User created successfully"}
    except Exception:
        raise HTTPException(status_code=500, detail={"error": "Error creating user"}) from None


@router.post("/logout")
async def logout(_user: JwtUser = Depends(get_current_user)):
    return {"message": "Logged out successfully"}


@router.post("/forgot-password")
async def forgot_password(body: EmailBody):
    user = await user_repo.find_by_email(str(body.email))
    if not user:
        raise HTTPException(status_code=404, detail={"error": "User not found"})
    token, expiry = user_repo.generate_reset_token()
    await user_repo.update_user(str(user["_id"]), {"resetToken": token, "resetTokenExpiry": expiry})
    try:
        auth_email.send_reset_email(str(body.email), token)
    except Exception:
        raise HTTPException(status_code=500, detail={"error": "Failed to send reset email"}) from None
    return {"message": "Password reset email sent"}


@router.post("/reset-password")
async def reset_password(body: ResetPasswordBody):
    from app.database import get_db

    user = await get_db().users.find_one({"resetToken": body.token})
    if not user or not user_repo.validate_reset_token(user, body.token):
        raise HTTPException(status_code=400, detail={"error": "Invalid or expired reset token"})
    if not PASSWORD_REGEX.match(body.password):
        raise HTTPException(status_code=400, detail={"error": "Password does not meet requirements"})
    hashed = user_repo._hash_password(body.password)
    await user_repo.update_user(
        str(user["_id"]),
        {"password": hashed, "resetToken": None, "resetTokenExpiry": None},
    )
    return {"message": "Password reset successful"}


@router.post("/send-verification-email")
async def send_verification_email(body: EmailBody):
    user = await user_repo.find_by_email(str(body.email))
    if not user:
        raise HTTPException(status_code=404, detail={"error": "User not found"})
    token = user_repo.generate_verification_token()
    await user_repo.update_user(str(user["_id"]), {"verificationToken": token})
    try:
        auth_email.send_verification_email(str(body.email), token)
    except Exception:
        raise HTTPException(status_code=500, detail={"error": "Failed to send verification email"}) from None
    return {"message": "Verification email sent"}


@router.get("/verify-email")
async def verify_email(token: str = Query(...)):
    from app.database import get_db

    user = await get_db().users.find_one({"verificationToken": token})
    if not user:
        raise HTTPException(status_code=400, detail={"error": "Invalid verification token"})
    await user_repo.update_user(str(user["_id"]), {"verified": True, "verificationToken": None})
    return {"message": "Email verified successfully"}
