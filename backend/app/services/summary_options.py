from app.repositories import preferences as pref_repo


async def summary_options_for_user(user_id: str, overrides: dict | None = None) -> dict:
    prefs = await pref_repo.find_by_user_id(user_id)
    options = {
        "length": (prefs or {}).get("defaultSummaryLength", "medium"),
        "style": (prefs or {}).get("summaryStyle", "paragraph"),
    }
    if overrides:
        options.update({k: v for k, v in overrides.items() if v is not None})
    return options
