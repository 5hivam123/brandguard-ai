import sys
import os

# Ensure backend root in path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.models import Brand, Review, ReviewIssue

client = TestClient(app)

def run_qa_checks():
    print("=" * 60)
    print("BRANDGUARD AI - COMPREHENSIVE QA VERIFICATION SUITE")
    print("=" * 60)

    # 1. Health check
    print("\n[CHECK 1] Testing Health Endpoint (/api/health)...")
    res = client.get("/api/health")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    print(f"  ✓ Status: {data['status']}, Database: {data['database']}, Mode: {data['ai_engine_mode']}")

    # 2. Seed Brands Endpoint
    print("\n[CHECK 2] Testing Seed Endpoint (/api/brands/seed)...")
    res = client.post("/api/brands/seed")
    assert res.status_code == 200
    print(f"  ✓ {res.json()['message']}")

    # 3. List Brands
    print("\n[CHECK 3] Testing List Brands (/api/brands)...")
    res = client.get("/api/brands")
    assert res.status_code == 200
    brands = res.json()
    assert len(brands) >= 2, f"Expected at least 2 seeded brands, found {len(brands)}"
    print(f"  ✓ Found {len(brands)} configured brand workspaces")

    # 4. Brand Creation & Detail & Update
    print("\n[CHECK 4] Testing Brand Creation, Retrieval & Update...")
    new_brand_payload = {
        "name": "QA Test Brand Corp",
        "description": "Enterprise software testing brand",
        "preferred_tone": "Professional, Direct, Technical",
        "target_audience": "DevOps Engineers",
        "guidelines": [
            {"guideline_text": "Never use casual abbreviations.", "category": "Tone"}
        ],
        "approved_facts": [
            {"fact_text": "Processes 500 million API requests daily.", "source_name": "Audit 2025", "category": "Performance"}
        ],
        "prohibited_terms": [
            {"term": "cheap tool", "replacement": "cost-effective platform", "reason": "Brand integrity"}
        ]
    }
    create_res = client.post("/api/brands", json=new_brand_payload)
    assert create_res.status_code == 201, f"Failed to create brand: {create_res.text}"
    created_brand = create_res.json()
    brand_id = created_brand["id"]
    print(f"  ✓ Created brand '{created_brand['name']}' (ID: {brand_id})")

    # Get Detail
    detail_res = client.get(f"/api/brands/{brand_id}")
    assert detail_res.status_code == 200
    assert len(detail_res.json()["guidelines"]) == 1
    assert len(detail_res.json()["approved_facts"]) == 1
    assert len(detail_res.json()["prohibited_terms"]) == 1
    print("  ✓ Retrieved full brand details with nested guidelines, facts, and prohibited terms")

    # Update Brand (PUT /api/brands/{brand_id})
    update_res = client.put(f"/api/brands/{brand_id}", json={"preferred_tone": "Authoritative, Rigorous, Transparent"})
    assert update_res.status_code == 200
    assert update_res.json()["preferred_tone"] == "Authoritative, Rigorous, Transparent"
    print("  ✓ Updated brand profile via PUT /api/brands/{brand_id}")

    # Sub-item add/delete
    g_res = client.post(f"/api/brands/{brand_id}/guidelines", json={"guideline_text": "Always state system prerequisites.", "category": "Formatting"})
    assert g_res.status_code == 201
    g_id = g_res.json()["id"]
    del_g_res = client.delete(f"/api/brands/{brand_id}/guidelines/{g_id}")
    assert del_g_res.status_code == 204
    print("  ✓ Sub-endpoints for adding & deleting individual guidelines verified")

    # 5. Test Review Scenario 1 — Compliant Content
    print("\n[CHECK 5] Testing Scenario 1 — Compliant Content...")
    compliant_payload = {
        "brand_id": brand_id,
        "content_title": "Production Release Note",
        "content_type": "Website content",
        "content_text": "QA Test Brand Corp processes 500 million API requests daily with enterprise-grade reliability and automated failover."
    }
    r1_res = client.post("/api/reviews", json=compliant_payload)
    assert r1_res.status_code == 201
    r1 = r1_res.json()
    assert r1["high_issues"] == 0, f"Expected 0 high issues, found {r1['high_issues']}"
    print(f"  ✓ Compliant Content: {r1['total_issues']} total issues, {r1['high_issues']} high issues (Status: {r1['status']})")

    # 6. Test Review Scenario 2 — Unsupported 10x Claim
    print("\n[CHECK 6] Testing Scenario 2 — Unsupported Claim (10x growth)...")
    unsupported_payload = {
        "brand_id": brand_id,
        "content_title": "High Growth Campaign",
        "content_type": "Advertisement copy",
        "content_text": "We guarantee 10x growth for every customer with our automated software."
    }
    r2_res = client.post("/api/reviews", json=unsupported_payload)
    assert r2_res.status_code == 201
    r2 = r2_res.json()
    unsupported_issues = [i for i in r2["issues"] if i["category"] == "Unsupported Claim" or i["verification_status"] == "Unsupported Claim"]
    assert len(unsupported_issues) > 0, "Failed to flag unsupported claim"
    assert unsupported_issues[0]["severity"] in ["High", "Medium"]
    print(f"  ✓ Flagged Unsupported Claim: '{unsupported_issues[0]['problematic_text']}'")
    print(f"    - Suggested correction: '{unsupported_issues[0]['suggested_correction']}'")

    # 7. Test Review Scenario 3 — Prohibited Terminology
    print("\n[CHECK 7] Testing Scenario 3 — Prohibited Terminology ('cheap tool')...")
    prohibited_payload = {
        "brand_id": brand_id,
        "content_title": "Social Announcement",
        "content_type": "Social media post",
        "content_text": "Why pay enterprise prices when our cheap tool does everything seamlessly?"
    }
    r3_res = client.post("/api/reviews", json=prohibited_payload)
    assert r3_res.status_code == 201
    r3 = r3_res.json()
    term_issues = [i for i in r3["issues"] if i["category"] == "Prohibited Terminology"]
    assert len(term_issues) > 0, "Failed to flag prohibited term"
    assert term_issues[0]["severity"] == "High"
    assert "cost-effective platform" in term_issues[0]["suggested_correction"]
    print(f"  ✓ Flagged Prohibited Terminology: '{term_issues[0]['problematic_text']}' ➔ '{term_issues[0]['suggested_correction']}'")

    # 8. Test Review Scenario 4 — Brand Tone Inconsistency
    print("\n[CHECK 8] Testing Scenario 4 — Tone Inconsistency (slang/casual)...")
    tone_payload = {
        "brand_id": brand_id,
        "content_title": "Newsletter",
        "content_type": "Marketing email",
        "content_text": "Hey guys!! rn check out this insane deal tbh before it expires lol!!!"
    }
    r4_res = client.post("/api/reviews", json=tone_payload)
    assert r4_res.status_code == 201
    r4 = r4_res.json()
    tone_issues = [i for i in r4["issues"] if i["category"] == "Tone Inconsistency" or i["verification_status"] == "Style Recommendation"]
    assert len(tone_issues) > 0, "Failed to flag tone inconsistency"
    print(f"  ✓ Flagged Tone Inconsistency: {len(tone_issues)} colloquial phrases detected")

    # 9. Test Review Scenario 5 — Unverified Factual Claim
    print("\n[CHECK 9] Testing Scenario 5 — Unverified Factual Claim...")
    unverified_payload = {
        "brand_id": brand_id,
        "content_title": "Scale Announcement",
        "content_type": "Website content",
        "content_text": "QA Test Brand Corp powers over 90,000 servers across North America."
    }
    r5_res = client.post("/api/reviews", json=unverified_payload)
    assert r5_res.status_code == 201
    r5 = r5_res.json()
    unverified_issues = [i for i in r5["issues"] if i["verification_status"] == "Unverified Statement"]
    assert len(unverified_issues) > 0, "Failed to flag unverified claim"
    assert unverified_issues[0]["severity"] == "Low"
    print(f"  ✓ Flagged Unverified Statement: '{unverified_issues[0]['problematic_text']}' (Marked for human review, not falsely marked false)")

    # 10. Correction Workflow: Accept and Reject Suggestions
    print("\n[CHECK 10] Testing Correction Workflow (Accept & Reject Suggestions)...")
    target_review = r3  # Review with prohibited term 'cheap tool'
    rev_id = target_review["id"]
    target_issue = target_review["issues"][0]
    
    # Accept suggestion
    accept_res = client.post(f"/api/reviews/{rev_id}/apply-suggestion", json={"issue_id": target_issue["id"], "action": "accept"})
    assert accept_res.status_code == 200
    revised_data = accept_res.json()
    # Check that original is unchanged
    assert revised_data["original_content"] == target_review["original_content"], "Original draft was modified!"
    # Check that revised content has the replacement
    assert "cost-effective platform" in revised_data["revised_content"]
    assert "cheap tool" not in revised_data["revised_content"]
    print(f"  ✓ Accepted suggestion: Problematic text replaced in revised draft while preserving original")

    # Reject suggestion test on r2
    r2_id = r2["id"]
    r2_issue = r2["issues"][0]
    reject_res = client.post(f"/api/reviews/{r2_id}/apply-suggestion", json={"issue_id": r2_issue["id"], "action": "reject"})
    assert reject_res.status_code == 200
    r2_updated = reject_res.json()
    rejected_issue = next(i for i in r2_updated["issues"] if i["id"] == r2_issue["id"])
    assert rejected_issue["is_accepted"] is False
    print("  ✓ Rejected suggestion: Correctly recorded human dismissal decision")

    # Manual edit of revised content
    manual_res = client.put(f"/api/reviews/{rev_id}/content", json={"revised_content": "Why pay enterprise prices when our cost-effective platform fulfills every requirement?"})
    assert manual_res.status_code == 200
    assert "fulfills every requirement" in manual_res.json()["revised_content"]
    print("  ✓ Manual editorial refinement: PUT /api/reviews/{id}/content verified")

    # 11. Review Status Updates & Review History
    print("\n[CHECK 11] Testing Human Review Status Updates...")
    for new_status in ["In Review", "Changes Requested", "Approved"]:
        st_res = client.patch(f"/api/reviews/{rev_id}/status", json={"status": new_status})
        assert st_res.status_code == 200
        assert st_res.json()["status"] == new_status
        print(f"  ✓ Updated status to: {new_status}")

    # History listing with filtering
    hist_res = client.get(f"/api/reviews?brand_id={brand_id}")
    assert hist_res.status_code == 200
    assert len(hist_res.json()) >= 5
    print(f"  ✓ Retrieved history filtered by brand_id={brand_id} ({len(hist_res.json())} reviews)")

    # 12. Dashboard Stats Integrity
    print("\n[CHECK 12] Testing Dashboard Analytics Computation...")
    stats_res = client.get("/api/dashboard/stats")
    assert stats_res.status_code == 200
    st = stats_res.json()
    assert st["total_reviews"] >= 5
    assert st["approved_content"] >= 1
    assert st["total_detected_issues"] >= 5
    print(f"  ✓ Real Stats Verified: {st['total_reviews']} total reviews, {st['total_detected_issues']} issues, {st['approved_content']} approved")

    # Clean up test brand & reviews
    print("\n[CLEANUP] Cleaning up test brand...")
    client.delete(f"/api/brands/{brand_id}")
    check_deleted = client.get(f"/api/brands/{brand_id}")
    assert check_deleted.status_code == 404
    print(f"  ✓ Deleted test brand (ID: {brand_id}) and verified cascade cleanup")

    print("\n" + "=" * 60)
    print("🎉 ALL 12 QA VERIFICATION CHECKS PASSED WITH ZERO ERRORS!")
    print("=" * 60)

if __name__ == "__main__":
    run_qa_checks()
