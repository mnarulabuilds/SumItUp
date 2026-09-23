from pathlib import Path

import pytest

from app.errors import AppError
from app.utils import upload_paths


def test_resolve_upload_path_strips_traversal(tmp_path, monkeypatch):
    monkeypatch.setattr(upload_paths, "UPLOAD_PATH", tmp_path)
    resolved = upload_paths.resolve_upload_path("../../etc/passwd")
    assert resolved.parent == tmp_path
    assert resolved.name == "passwd"


def test_empty_filename_raises(tmp_path, monkeypatch):
    monkeypatch.setattr(upload_paths, "UPLOAD_PATH", tmp_path)
    with pytest.raises(AppError):
        upload_paths.resolve_upload_path("   ")


def test_assert_upload_exists_missing(tmp_path, monkeypatch):
    monkeypatch.setattr(upload_paths, "UPLOAD_PATH", tmp_path)
    with pytest.raises(AppError) as exc:
        upload_paths.assert_upload_exists("missing.txt")
    assert exc.value.status_code == 404


def test_assert_upload_exists_ok(tmp_path, monkeypatch):
    monkeypatch.setattr(upload_paths, "UPLOAD_PATH", tmp_path)
    file_path = tmp_path / "demo.txt"
    file_path.write_text("hello", encoding="utf-8")
    assert upload_paths.assert_upload_exists("demo.txt") == Path(file_path)
