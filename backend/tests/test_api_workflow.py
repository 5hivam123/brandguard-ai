import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield

def test_api_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert "ai_engine_mode" in data

def test_seed_brands():
    response = client.post("/api/brands/seed")
    assert response.status_code == 200
    assert "Successfully seeded" in response.json()["message"]

def test_list_and_get_brand():
    response = client.get("/api/brands")
    assert response.status_code == 200
    brands = response.json()
    assert len(brands) >= 1
    
    brand_id = brands[0]["id"]
    detail = client.get(f"/api/brands/{brand_id}")
    assert detail.status_code == 200
    b_data = detail.json()
    assert "guidelines" in b_data
    assert "approved_facts" in b_data
    assert "prohibited_terms" in b_data

def test_full_review_workflow():
    # 1. Get ApexPay brand
    brands = client.get("/api/brands").json()
    apex = next(b for b in brands if b["name"] == "ApexPay Technologies")
    
    # 2. Submit non-compliant content
    submission = {
        "brand_id": apex["id"],
        "content_title": "Q1 Launch Post",
        "content_type": "Social media post",
        "content_text": "We are the cheapest in India! We guarantee 10x growth for every customer tbh!!"
    }
    create_res = client.post("/api/reviews", json=submission)
    assert create_res.status_code == 201
    review = create_res.json()
    assert review["total_issues"] >= 2
    assert review["status"] == "In Review"
    
    review_id = review["id"]
    assert len(review["issues"]) > 0

    # 3. Accept a suggestion
    first_issue = review["issues"][0]
    apply_res = client.post(
        f"/api/reviews/{review_id}/apply-suggestion",
        json={"issue_id": first_issue["id"], "action": "accept"}
    )
    assert apply_res.status_code == 200
    updated_review = apply_res.json()
    # Check that original content was NOT changed
    assert updated_review["original_content"] == submission["content_text"]
    # Check that revised content updated
    assert updated_review["revised_content"] != ""

    # 4. Update status to Approved
    status_res = client.patch(
        f"/api/reviews/{review_id}/status",
        json={"status": "Approved"}
    )
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "Approved"

    # 5. Check dashboard stats
    stats_res = client.get("/api/dashboard/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_reviews"] >= 1
    assert stats["approved_content"] >= 1
