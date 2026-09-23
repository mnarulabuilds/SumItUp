from fastapi import APIRouter, Depends, HTTPException, Query

from app.dependencies import JwtUser, get_current_user
from app.services import content_search

router = APIRouter(prefix="/search", tags=["search"], dependencies=[Depends(get_current_user)])


@router.get("/fuzzy")
async def fuzzy_search(
    query: str | None = Query(None),
    type: str | None = Query(None),
    limit: int = Query(10),
    user: JwtUser = Depends(get_current_user),
):
    if not query or not query.strip():
        raise HTTPException(status_code=400, detail={"error": "Search query is required"})
    limit = max(1, min(50, limit))
    results = await content_search.fuzzy_search(user.id, query.strip(), type, limit)
    return {"results": results, "count": len(results)}


@router.get("/books")
async def search_books(
    title: str | None = Query(None),
    author: str | None = Query(None),
    genre: str | None = Query(None),
    limit: int = Query(10),
    user: JwtUser = Depends(get_current_user),
):
    if not any([title, author, genre]):
        raise HTTPException(status_code=400, detail={"error": "At least one search parameter is required"})
    limit = max(1, min(50, limit))
    results = await content_search.search_books(user.id, title, author, genre, limit)
    return {"results": results, "count": len(results)}
