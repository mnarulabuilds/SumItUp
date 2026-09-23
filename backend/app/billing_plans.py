BILLING_PLANS = [
    {
        "id": "free",
        "name": "Free",
        "priceCents": 0,
        "interval": "month",
        "tokensIncluded": 100,
        "adFree": False,
        "features": ["Basic summaries", "Watch ads to earn tokens"],
    },
    {
        "id": "plus",
        "name": "Plus",
        "priceCents": 999,
        "interval": "month",
        "tokensIncluded": 1000,
        "adFree": True,
        "features": ["Higher quality summaries", "Ad-free experience", "Meeting summaries"],
    },
    {
        "id": "pro",
        "name": "Pro",
        "priceCents": 1999,
        "interval": "month",
        "tokensIncluded": 5000,
        "adFree": True,
        "features": ["Priority processing", "Long-form content", "All Plus features"],
    },
]
