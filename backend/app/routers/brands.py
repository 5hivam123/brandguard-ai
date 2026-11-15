from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Brand, BrandGuideline, ApprovedFact, ProhibitedTerm, Review
from app.schemas import (
    BrandCreate, BrandUpdate, BrandResponse, BrandDetailResponse,
    BrandGuidelineCreate, BrandGuidelineResponse,
    ApprovedFactCreate, ApprovedFactResponse,
    ProhibitedTermCreate, ProhibitedTermResponse
)

router = APIRouter(prefix="/api/brands", tags=["Brands"])

@router.post("", response_model=BrandDetailResponse, status_code=status.HTTP_201_CREATED)
def create_brand(brand_in: BrandCreate, db: Session = Depends(get_db)):
    """
    Create a new brand workspace with guidelines, approved facts, and prohibited terms.
    """
    existing = db.query(Brand).filter(func.lower(Brand.name) == brand_in.name.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A brand with the name '{brand_in.name}' already exists."
        )

    brand = Brand(
        name=brand_in.name.strip(),
        description=brand_in.description,
        preferred_tone=brand_in.preferred_tone.strip(),
        target_audience=brand_in.target_audience
    )
    db.add(brand)
    db.flush()

    # Add guidelines
    for g in brand_in.guidelines or []:
        guideline = BrandGuideline(
            brand_id=brand.id,
            guideline_text=g.guideline_text.strip(),
            category=g.category
        )
        db.add(guideline)

    # Add approved facts
    for f in brand_in.approved_facts or []:
        fact = ApprovedFact(
            brand_id=brand.id,
            fact_text=f.fact_text.strip(),
            source_name=f.source_name,
            category=f.category
        )
        db.add(fact)

    # Add prohibited terms
    for p in brand_in.prohibited_terms or []:
        term = ProhibitedTerm(
            brand_id=brand.id,
            term=p.term.strip(),
            replacement=p.replacement.strip() if p.replacement else None,
            reason=p.reason.strip() if p.reason else None
        )
        db.add(term)

    db.commit()
    db.refresh(brand)
    return brand

@router.get("", response_model=List[BrandResponse])
def list_brands(db: Session = Depends(get_db)):
    """
    List all configured brands with summary counts.
    """
    brands = db.query(Brand).order_by(Brand.created_at.desc()).all()
    results = []
    for b in brands:
        results.append(BrandResponse(
            id=b.id,
            name=b.name,
            description=b.description,
            preferred_tone=b.preferred_tone,
            target_audience=b.target_audience,
            created_at=b.created_at,
            updated_at=b.updated_at,
            guidelines_count=len(b.guidelines),
            approved_facts_count=len(b.approved_facts),
            prohibited_terms_count=len(b.prohibited_terms),
            reviews_count=len(b.reviews)
        ))
    return results

@router.get("/{brand_id}", response_model=BrandDetailResponse)
def get_brand(brand_id: int, db: Session = Depends(get_db)):
    """
    Get detailed brand profile with all guidelines, facts, and prohibited terms.
    """
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Brand with ID {brand_id} not found."
        )
    return brand

@router.put("/{brand_id}", response_model=BrandDetailResponse)
def update_brand(brand_id: int, brand_update: BrandUpdate, db: Session = Depends(get_db)):
    """
    Update brand profile details.
    """
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")

    if brand_update.name is not None:
        brand.name = brand_update.name.strip()
    if brand_update.description is not None:
        brand.description = brand_update.description
    if brand_update.preferred_tone is not None:
        brand.preferred_tone = brand_update.preferred_tone.strip()
    if brand_update.target_audience is not None:
        brand.target_audience = brand_update.target_audience

    db.commit()
    db.refresh(brand)
    return brand

@router.delete("/{brand_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_brand(brand_id: int, db: Session = Depends(get_db)):
    """
    Delete brand profile and all associated data.
    """
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")
    db.delete(brand)
    db.commit()
    return None

# Sub-endpoints to manage guidelines, facts, and terms individually
@router.post("/{brand_id}/guidelines", response_model=BrandGuidelineResponse, status_code=status.HTTP_201_CREATED)
def add_guideline(brand_id: int, g_in: BrandGuidelineCreate, db: Session = Depends(get_db)):
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")
    guideline = BrandGuideline(brand_id=brand_id, guideline_text=g_in.guideline_text.strip(), category=g_in.category)
    db.add(guideline)
    db.commit()
    db.refresh(guideline)
    return guideline

@router.delete("/{brand_id}/guidelines/{guideline_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_guideline(brand_id: int, guideline_id: int, db: Session = Depends(get_db)):
    guideline = db.query(BrandGuideline).filter(BrandGuideline.id == guideline_id, BrandGuideline.brand_id == brand_id).first()
    if not guideline:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guideline not found")
    db.delete(guideline)
    db.commit()
    return None

@router.post("/{brand_id}/facts", response_model=ApprovedFactResponse, status_code=status.HTTP_201_CREATED)
def add_fact(brand_id: int, f_in: ApprovedFactCreate, db: Session = Depends(get_db)):
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")
    fact = ApprovedFact(brand_id=brand_id, fact_text=f_in.fact_text.strip(), source_name=f_in.source_name, category=f_in.category)
    db.add(fact)
    db.commit()
    db.refresh(fact)
    return fact

@router.delete("/{brand_id}/facts/{fact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_fact(brand_id: int, fact_id: int, db: Session = Depends(get_db)):
    fact = db.query(ApprovedFact).filter(ApprovedFact.id == fact_id, ApprovedFact.brand_id == brand_id).first()
    if not fact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fact not found")
    db.delete(fact)
    db.commit()
    return None

@router.post("/{brand_id}/prohibited-terms", response_model=ProhibitedTermResponse, status_code=status.HTTP_201_CREATED)
def add_prohibited_term(brand_id: int, p_in: ProhibitedTermCreate, db: Session = Depends(get_db)):
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")
    term = ProhibitedTerm(brand_id=brand_id, term=p_in.term.strip(), replacement=p_in.replacement, reason=p_in.reason)
    db.add(term)
    db.commit()
    db.refresh(term)
    return term

@router.delete("/{brand_id}/prohibited-terms/{term_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prohibited_term(brand_id: int, term_id: int, db: Session = Depends(get_db)):
    term = db.query(ProhibitedTerm).filter(ProhibitedTerm.id == term_id, ProhibitedTerm.brand_id == brand_id).first()
    if not term:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prohibited term not found")
    db.delete(term)
    db.commit()
    return None

@router.post("/seed", status_code=status.HTTP_200_OK)
def seed_default_brands(db: Session = Depends(get_db)):
    """
    Seed initial realistic brand datasets for hackathon judges & demonstrations.
    """
    seeded_count = 0

    # Brand 1: ApexPay Technologies (FinTech enterprise)
    existing_apex = db.query(Brand).filter(Brand.name == "ApexPay Technologies").first()
    if not existing_apex:
        apex = Brand(
            name="ApexPay Technologies",
            description="Enterprise B2B payment infrastructure powering digital commerce across Asia-Pacific.",
            preferred_tone="Professional, Authoritative, Trustworthy, Transparent",
            target_audience="Fintech CTOs, CFOs, Risk Officers, and Product Managers"
        )
        db.add(apex)
        db.flush()

        guidelines = [
            ("Maintain a professional, transparent, and authoritative tone suitable for regulated financial institutions.", "Tone"),
            ("Never guarantee investment returns or commercial revenue multipliers without validated audit disclosures.", "Legal"),
            ("Avoid competitor disparagement or unverified superlative comparisons.", "Messaging"),
            ("Always use active voice and precise technical terminology.", "Formatting")
        ]
        for text, cat in guidelines:
            db.add(BrandGuideline(brand_id=apex.id, guideline_text=text, category=cat))

        facts = [
            ("ApexPay processes transactions with an audited 99.99% system availability.", "SOC-2 Type II Report 2025", "Performance"),
            ("Supports instant settlements across 45 national clearing networks.", "Product Specification v4.2", "Feature"),
            ("Over 12,000 businesses currently use ApexPay APIs.", "Q4 2025 Shareholder Filing", "Performance"),
            ("Compliant with PCI-DSS Level 1 security standards.", "PCI Security Standards Council Audit", "Certification")
        ]
        for fact_text, src, cat in facts:
            db.add(ApprovedFact(brand_id=apex.id, fact_text=fact_text, source_name=src, category=cat))

        prohibited = [
            ("cheapest in India", "competitively priced for Indian enterprises", "Comparative price claim without third-party audit backing."),
            ("100% risk-free", "comprehensive risk mitigation framework", "Zero-risk claim violates financial advertising regulations."),
            ("instant riches", "sustainable growth acceleration", "Misleading promotional language.")
        ]
        for term, rep, rsn in prohibited:
            db.add(ProhibitedTerm(brand_id=apex.id, term=term, replacement=rep, reason=rsn))

        seeded_count += 1

    # Brand 2: EcoNova Organics (Sustainable Consumer Goods)
    existing_eco = db.query(Brand).filter(Brand.name == "EcoNova Organics").first()
    if not existing_eco:
        eco = Brand(
            name="EcoNova Organics",
            description="Certified sustainable personal care brand dedicated to zero-waste packaging and pure organic ingredients.",
            preferred_tone="Warm, Inspiring, Conscious, Scientifically Credible",
            target_audience="Eco-conscious consumers and wellness advocates"
        )
        db.add(eco)
        db.flush()

        guidelines = [
            ("Emphasize ethical sourcing, transparency, and scientific efficacy without greenwashing.", "Tone"),
            ("Every sustainability assertion must cite third-party ecological certification.", "Legal")
        ]
        for text, cat in guidelines:
            db.add(BrandGuideline(brand_id=eco.id, guideline_text=text, category=cat))

        facts = [
            ("100% of product packaging is compostable within 90 days in home compost systems.", "TUV Austria OK Compost Certification", "Certification"),
            ("Formulas contain zero microplastics, parabens, or synthetic phthalates.", "EWG Verified Certification 2025", "Performance")
        ]
        for fact_text, src, cat in facts:
            db.add(ApprovedFact(brand_id=eco.id, fact_text=fact_text, source_name=src, category=cat))

        prohibited = [
            ("miracle cure", "evidence-backed natural formula", "Unsubstantiated therapeutic claim."),
            ("zero chemical", "naturally derived botanical ingredients", "Scientifically inaccurate terminology.")
        ]
        for term, rep, rsn in prohibited:
            db.add(ProhibitedTerm(brand_id=eco.id, term=term, replacement=rep, reason=rsn))

        seeded_count += 1

    db.commit()
    return {"message": f"Successfully seeded {seeded_count} demo brands with complete guidelines and approved facts."}
