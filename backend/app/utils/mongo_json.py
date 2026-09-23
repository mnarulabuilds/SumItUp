from datetime import datetime
from typing import Any

from bson import ObjectId


def serialize_mongo_doc(doc: dict[str, Any] | None) -> dict[str, Any] | None:
    if not doc:
        return doc
    out: dict[str, Any] = {}
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            out[key] = str(value)
        elif isinstance(value, datetime):
            out[key] = value.isoformat()
        else:
            out[key] = value
    return out


def serialize_mongo_docs(docs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [serialize_mongo_doc(d) or {} for d in docs]
