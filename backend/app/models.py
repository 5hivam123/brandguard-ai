from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class Brand(Base):
    __tablename__ = "brands"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    preferred_tone = Column(String(255), nullable=False, default="Professional, Trustworthy, Clear")
    target_audience = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    guidelines = relationship("BrandGuideline", back_populates="brand", cascade="all, delete-orphan")
    approved_facts = relationship("ApprovedFact", back_populates="brand", cascade="all, delete-orphan")
    prohibited_terms = relationship("ProhibitedTerm", back_populates="brand", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="brand", cascade="all, delete-orphan")


class BrandGuideline(Base):
    __tablename__ = "brand_guidelines"

    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id", ondelete="CASCADE"), nullable=False)
    guideline_text = Column(Text, nullable=False)
    category = Column(String(100), default="General")  # Tone, Messaging, Legal, Formatting
    created_at = Column(DateTime, default=utc_now)

    brand = relationship("Brand", back_populates="guidelines")


class ApprovedFact(Base):
    __tablename__ = "approved_facts"

    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id", ondelete="CASCADE"), nullable=False)
    fact_text = Column(Text, nullable=False)
    source_name = Column(String(255), nullable=True)  # e.g., "Annual Financial Report 2025"
    category = Column(String(100), default="Performance")  # Performance, Certification, Pricing, Feature
    created_at = Column(DateTime, default=utc_now)

    brand = relationship("Brand", back_populates="approved_facts")


class ProhibitedTerm(Base):
    __tablename__ = "prohibited_terms"

    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id", ondelete="CASCADE"), nullable=False)
    term = Column(String(255), nullable=False)
    replacement = Column(String(255), nullable=True)
    reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    brand = relationship("Brand", back_populates="prohibited_terms")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id", ondelete="CASCADE"), nullable=False)
    content_title = Column(String(255), nullable=False)
    content_type = Column(String(100), nullable=False)  # "Social media post", "Advertisement copy", "Website content", "Marketing email"
    original_content = Column(Text, nullable=False)
    revised_content = Column(Text, nullable=False)
    status = Column(String(50), default="In Review")  # "Draft", "In Review", "Changes Requested", "Approved"
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    brand = relationship("Brand", back_populates="reviews")
    issues = relationship("ReviewIssue", back_populates="review", cascade="all, delete-orphan")


class ReviewIssue(Base):
    __tablename__ = "review_issues"

    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(100), nullable=False)
    # Severity: "High", "Medium", "Low"
    severity = Column(String(20), nullable=False)
    problematic_text = Column(Text, nullable=False)
    explanation = Column(Text, nullable=False)
    supporting_evidence = Column(Text, nullable=True)
    suggested_correction = Column(Text, nullable=False)
    # Verification status: "Confirmed Conflict", "Unsupported Claim", "Unverified Statement", "Style Recommendation", "Needs Human Review"
    verification_status = Column(String(100), default="Needs Human Review")
    # Acceptance status for human review workflow: None (pending), True (accepted), False (rejected)
    is_accepted = Column(Boolean, nullable=True, default=None)
    created_at = Column(DateTime, default=utc_now)

    review = relationship("Review", back_populates="issues")
