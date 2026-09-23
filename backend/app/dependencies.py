from typing import Annotated

import jwt
from fastapi import Depends, Header, HTTPException

from app.config import JWT_SECRET


class JwtUser:
    def __init__(self, id: str):
        self.id = id


async def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
) -> JwtUser:
    if not authorization:
        raise HTTPException(status_code=401, detail={"error": "Authentication required"})
    token = authorization.replace("Bearer ", "", 1).strip()
    if not token:
        raise HTTPException(status_code=401, detail={"error": "Authentication required"})
    if not JWT_SECRET:
        raise HTTPException(status_code=500, detail={"error": "JWT secret not configured"})
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail={"error": "Invalid auth token"})
        return JwtUser(id=str(user_id))
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail={"error": "Invalid auth token"}) from exc
