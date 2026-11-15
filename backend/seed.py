import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, Base, engine
from app.models import Brand, BrandGuideline, ApprovedFact, ProhibitedTerm, Review, ReviewIssue

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("🌱 Seeding BrandGuard AI demonstration database...")

    # Brand 1: ApexPay Technologies
    apex = db.query(Brand).filter(Brand.name == "ApexPay Technologies").first()
    if not apex:
        apex = Brand(
            name="ApexPay Technologies",
            description="Enterprise payment infrastructure powering digital commerce across Asia-Pacific.",
            preferred_tone="Professional, Authoritative, Trustworthy, Transparent",
            target_audience="Fintech CTOs, CFOs, Risk Officers, and Product Managers"
        )
        db.add(apex)
        db.flush()

        guidelines = [
            ("Maintain a professional, transparent, and authoritative tone suitable for regulated institutions.", "Tone"),
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

        print("  ✓ Created ApexPay Technologies brand profile")

    # Brand 2: EcoNova Organics
    eco = db.query(Brand).filter(Brand.name == "EcoNova Organics").first()
    if not eco:
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

        print("  ✓ Created EcoNova Organics brand profile")

    db.commit()
    print("✨ Seeding completed successfully!")
    db.close()

if __name__ == "__main__":
    seed()
