from app.utils.generate_summary_from_text import generate_summary_from_text


def test_empty_input():
    assert generate_summary_from_text("") == ""
    assert generate_summary_from_text(None) == ""


def test_short_text_unchanged():
    short = "One sentence only."
    assert generate_summary_from_text(short) == short


def test_longer_text_shorter_summary():
    text = " ".join(
        [
            "The product launch exceeded expectations across all regions.",
            "Revenue grew twenty percent year over year in the first quarter.",
            "Customer satisfaction scores reached an all-time high.",
            "The team attributed success to improved onboarding and support.",
            "Marketing campaigns focused on clarity and measurable outcomes.",
            "Engineering shipped critical performance fixes ahead of schedule.",
            "In conclusion, the company remains focused on sustainable growth.",
        ]
    )
    summary = generate_summary_from_text(text)
    assert len(summary) < len(text)
    assert len(summary) > 20
