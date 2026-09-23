from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.dependencies import JwtUser, get_current_user
from app.repositories import content as content_repo
from app.utils.mongo_json import serialize_mongo_doc, serialize_mongo_docs

router = APIRouter(prefix="/content", tags=["content"], dependencies=[Depends(get_current_user)])


class SaveContentBody(BaseModel):
    title: str
    originalContent: str
    summary: str
    contentType: str
    tags: list[str] | None = None
    metadata: dict | None = None


class TagsBody(BaseModel):
    tags: list[str]


@router.post("/save")
async def save_content(body: SaveContentBody, user: JwtUser = Depends(get_current_user)):
    if not body.title or not body.originalContent or not body.summary or not body.contentType:
        raise HTTPException(status_code=400, detail={"error": "Missing required content fields"})
    if body.contentType not in content_repo.CONTENT_TYPES:
        raise HTTPException(status_code=400, detail={"error": "Invalid content type"})
    try:
        doc = await content_repo.create_content(
            {
                "userId": user.id,
                "title": body.title,
                "originalContent": body.originalContent,
                "summary": body.summary,
                "contentType": body.contentType,
                "tags": body.tags or [],
                "metadata": body.metadata or {},
            }
        )
        return {"message": "Content saved successfully", "content": serialize_mongo_doc(doc)}
    except Exception:
        raise HTTPException(status_code=500, detail={"error": "Failed to save content"}) from None


@router.get("/history")
async def content_history(
    limit: int = Query(10),
    offset: int = Query(0),
    contentType: str | None = Query(None),
    user: JwtUser = Depends(get_current_user),
):
    options = {"limit": limit, "offset": offset}
    if contentType:
        options["contentType"] = contentType
    items = await content_repo.find_by_user_id(user.id, options)
    return {"content": serialize_mongo_docs(items), "count": len(items)}


@router.get("/favorites/list")
async def favorites_list(user: JwtUser = Depends(get_current_user)):
    items = await content_repo.find_by_user_id(user.id, {"isFavorite": True, "limit": 100})
    return {"favorites": serialize_mongo_docs(items)}


@router.get("/search/tags")
async def search_by_tags(tags: str | None = Query(None), user: JwtUser = Depends(get_current_user)):
    if not tags:
        raise HTTPException(status_code=400, detail={"error": "Tags query parameter is required"})
    tag_list = [t.strip() for t in tags.split(",") if t.strip()]
    results = await content_repo.search_by_tags(user.id, tag_list)
    return {"results": serialize_mongo_docs(results)}


@router.get("/{content_id}")
async def get_content(content_id: str, user: JwtUser = Depends(get_current_user)):
    doc = await content_repo.find_by_id(content_id, user.id)
    if not doc:
        raise HTTPException(status_code=404, detail={"error": "Content not found"})
    return {"content": serialize_mongo_doc(doc)}


@router.put("/{content_id}/favorite")
async def toggle_favorite(content_id: str, user: JwtUser = Depends(get_current_user)):
    doc = await content_repo.find_by_id(content_id, user.id)
    if not doc:
        raise HTTPException(status_code=404, detail={"error": "Content not found"})
    updated = await content_repo.update_content(content_id, {"isFavorite": not doc.get("isFavorite", False)})
    return {"content": serialize_mongo_doc(updated)}


@router.put("/{content_id}/tags/add")
async def add_tags(content_id: str, body: TagsBody, user: JwtUser = Depends(get_current_user)):
    if not body.tags or not isinstance(body.tags, list):
        raise HTTPException(status_code=400, detail={"error": "Tags array is required"})
    doc = await content_repo.find_by_id(content_id, user.id)
    if not doc:
        raise HTTPException(status_code=404, detail={"error": "Content not found"})
    merged = list(set(doc.get("tags", []) + body.tags))
    updated = await content_repo.update_content(content_id, {"tags": merged})
    return {"content": serialize_mongo_doc(updated)}


@router.put("/{content_id}/tags/remove")
async def remove_tags(content_id: str, body: TagsBody, user: JwtUser = Depends(get_current_user)):
    if not body.tags:
        raise HTTPException(status_code=400, detail={"error": "Tags array is required"})
    doc = await content_repo.find_by_id(content_id, user.id)
    if not doc:
        raise HTTPException(status_code=404, detail={"error": "Content not found"})
    remaining = [t for t in doc.get("tags", []) if t not in body.tags]
    updated = await content_repo.update_content(content_id, {"tags": remaining})
    return {"content": serialize_mongo_doc(updated)}


@router.delete("/{content_id}")
async def delete_content(content_id: str, user: JwtUser = Depends(get_current_user)):
    deleted = await content_repo.delete_content(content_id, user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail={"error": "Content not found"})
    return {"message": "Content deleted successfully"}
