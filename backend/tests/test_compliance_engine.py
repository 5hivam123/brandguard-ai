import pytest
from app.models import Brand, BrandGuideline, ApprovedFact, ProhibitedTerm
from app.services.review_engine import review_engine

@pytest.fixture
def sample_brand():
    """Setup a realistic test brand profile matching Section 10 specifications"""
    brand = Brand(
        id=1,
        name="ApexFin",
        description="Enterprise financial technology provider",
        preferred_tone="Professional, Authoritative, Trustworthy",
        target_audience="Enterprise Financial Officers"
    )
    brand.guidelines = [
        BrandGuideline(id=1, brand_id=1, guideline_text="Maintain a strictly professional, transparent tone.", category="Tone"),
        BrandGuideline(id=2, brand_id=1, guideline_text="Never make unverified performance guarantees.", category="Legal")
    ]
    brand.approved_facts = [
        ApprovedFact(id=1, brand_id=1, fact_text="ApexFin provides audited 99.99% system availability.", source_name="SOC2 Report 2025"),
        ApprovedFact(id=2, brand_id=1, fact_text="Serving over 10,000 corporate clients globally.", source_name="Q4 Shareholder Report")
    ]
    brand.prohibited_terms = [
        ProhibitedTerm(id=1, brand_id=1, term="cheapest in India", replacement="cost-competitive for Indian enterprises", reason="Regulatory restriction on unproven price superlatives"),
        ProhibitedTerm(id=2, brand_id=1, term="100% risk-free", replacement="comprehensive risk mitigation architecture", reason="Zero-risk claims violate financial compliance rules")
    ]
    return brand

@pytest.mark.asyncio
async def test_case_1_compliant_content(sample_brand):
    """
    Test Case 1 — Compliant Content:
    Brand tone and approved facts match the submitted content.
    Expected: No major violations.
    """
    content = "ApexFin provides audited 99.99% system availability, serving over 10,000 corporate clients globally with enterprise security."
    issues = await review_engine.analyze(content, "Website content", sample_brand)
    
    # Filter high severity issues
    high_issues = [i for i in issues if i["severity"] == "High"]
    assert len(high_issues) == 0, f"Expected 0 high severity issues, got: {high_issues}"

@pytest.mark.asyncio
async def test_case_2_unsupported_claim(sample_brand):
    """
    Test Case 2 — Unsupported Claim:
    Content says: "We guarantee 10x growth for every customer."
    Approved facts do not support this guarantee.
    Expected: Flag as unsupported claim.
    """
    content = "We guarantee 10x growth for every customer with our automated financial tooling."
    issues = await review_engine.analyze(content, "Advertisement copy", sample_brand)
    
    unsupported = [i for i in issues if i["category"] == "Unsupported Claim" or i["verification_status"] == "Unsupported Claim"]
    assert len(unsupported) > 0, "Expected an unsupported claim violation to be flagged"
    
    flagged = unsupported[0]
    assert "10x" in flagged["problematic_text"].lower() or "guarantee" in flagged["problematic_text"].lower()
    assert flagged["severity"] in ["High", "Medium"]
    assert len(flagged["suggested_correction"]) > 0

@pytest.mark.asyncio
async def test_case_3_prohibited_terminology(sample_brand):
    """
    Test Case 3 — Prohibited Terminology:
    A brand prohibits the phrase "cheapest in India".
    Submitted content contains that phrase.
    Expected: Flag terminology violation.
    """
    content = "Our enterprise platform is the cheapest in India, making enterprise payments seamless."
    issues = await review_engine.analyze(content, "Social media post", sample_brand)
    
    term_issues = [i for i in issues if i["category"] == "Prohibited Terminology"]
    assert len(term_issues) > 0, "Expected prohibited terminology issue to be flagged"
    
    flagged = term_issues[0]
    assert "cheapest in India" in flagged["problematic_text"]
    assert flagged["severity"] == "High"
    assert "cost-competitive" in flagged["suggested_correction"]
    assert flagged["verification_status"] == "Confirmed Conflict"

@pytest.mark.asyncio
async def test_case_4_tone_inconsistency(sample_brand):
    """
    Test Case 4 — Tone Inconsistency:
    Brand tone is professional.
    Submitted content uses overly casual language.
    Expected: Flag possible tone inconsistency.
    """
    content = "Hey guys!! rn you can snag this insane deal tbh, check it out right now!!!"
    issues = await review_engine.analyze(content, "Marketing email", sample_brand)
    
    tone_issues = [i for i in issues if i["category"] == "Tone Inconsistency" or i["verification_status"] == "Style Recommendation"]
    assert len(tone_issues) > 0, "Expected tone inconsistency violation"
    
    categories = [i["category"] for i in issues]
    assert "Tone Inconsistency" in categories

@pytest.mark.asyncio
async def test_case_5_unverified_claim(sample_brand):
    """
    Test Case 5 — Unverified Claim:
    Content contains a statement that has no matching approved fact.
    Expected: Mark it as unverified, not automatically false.
    """
    # Contains a specific claim ("over 75,000 merchants") not listed in approved facts (which only lists 10,000 corporate clients)
    content = "ApexFin powers over 75,000 merchants across Southeast Asia."
    issues = await review_engine.analyze(content, "Website content", sample_brand)
    
    unverified = [i for i in issues if i["verification_status"] == "Unverified Statement" or "Unverified" in i["category"]]
    assert len(unverified) > 0, "Expected unverified claim to be detected"
    
    flagged = unverified[0]
    assert flagged["verification_status"] == "Unverified Statement"
    assert "not automatically false" in flagged["explanation"] or "pending source citation" in flagged["explanation"] or "lacks" in flagged["explanation"]
