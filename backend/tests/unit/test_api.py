from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "success"


def test_login_validation():
    response = client.post("/api/auth/login", json={"email": "", "password": ""})
    assert response.status_code == 400
    assert response.json()["error"] == "Email and password are required"


def test_pdf_generate_post_empty():
    response = client.post("/api/pdf/generate", json={"summary": ""})
    assert response.status_code == 400
