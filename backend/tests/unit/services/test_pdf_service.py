import pytest

from app.services.pdf_service import generate_pdf


def test_generate_pdf_returns_path(tmp_path, monkeypatch):
    monkeypatch.setattr("app.services.pdf_service.PDF_PATH", tmp_path)
    path = generate_pdf("Hello PDF")
    assert path.endswith(".pdf")
    assert tmp_path.joinpath(path.split("/")[-1]).is_file()


def test_empty_summary_raises():
    with pytest.raises(ValueError):
        generate_pdf("")
