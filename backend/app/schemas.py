from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

# --- Brand Guidelines ---
class BrandGuidelineBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    guideline_text: str = Field(..., min_length=2, description="Guideline instruction or rule")
    category: str = Field("General", description="Category e.g. Tone, Legal, Messaging, Formatting")

class BrandGuidelineCreate(BrandGuidelineBase):
    pass

class BrandGuidelineResponse(BrandGuidelineBase):
    id: int
    brand_id: int
    created_at: datetime


# --- Approved Facts ---
class ApprovedFactBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    fact_text: str = Field(..., min_length=2, description="Verified fact or approved statement")
    source_name: Optional[str] = Field(None, description="Citation or internal document source")
    category: str = Field("Performance", description="Category e.g. Performance, Certification, Pricing")

class ApprovedFactCreate(ApprovedFactBase):
    pass

class ApprovedFactResponse(ApprovedFactBase):
    id: int
    brand_id: int
    created_at: datetime


# --- Prohibited Terms ---
class ProhibitedTermBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    term: str = Field(..., min_length=1, description="Prohibited word or phrase")
    replacement: Optional[str] = Field(None, description="Approved alternative")
    reason: Optional[str] = Field(None, description="Why this term is disallowed")

class ProhibitedTermCreate(ProhibitedTermBase):
    pass

class ProhibitedTermResponse(ProhibitedTermBase):
    id: int
    brand_id: int
    created_at: datetime


# --- Brands ---
class BrandBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    preferred_tone: str = Field("Professional, Trustworthy, Clear", max_length=255)
    target_audience: Optional[str] = Field(None, max_length=255)

class BrandCreate(BrandBase):
    guidelines: Optional[List[BrandGuidelineCreate]] = []
    approved_facts: Optional[List[ApprovedFactCreate]] = []
    prohibited_terms: Optional[List[ProhibitedTermCreate]] = []

class BrandUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    preferred_tone: Optional[str] = None
    target_audience: Optional[str] = None

class BrandResponse(BrandBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    guidelines_count: Optional[int] = 0
    approved_facts_count: Optional[int] = 0
    prohibited_terms_count: Optional[int] = 0
    reviews_count: Optional[int] = 0

class BrandDetailResponse(BrandBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    guidelines: List[BrandGuidelineResponse] = []
    approved_facts: List[ApprovedFactResponse] = []
    prohibited_terms: List[ProhibitedTermResponse] = []


# --- Review Issues ---
class ReviewIssueResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    review_id: int
    category: str
    severity: str  # High, Medium, Low
    problematic_text: str
    explanation: str
    supporting_evidence: Optional[str] = None
    suggested_correction: str
    verification_status: str
    is_accepted: Optional[bool] = None
    created_at: datetime


# --- Reviews ---
class ReviewCreate(BaseModel):
    brand_id: int
    content_title: str = Field(..., min_length=2, max_length=255)
    content_type: str = Field("Social media post", description="Content type")
    content_text: str = Field(..., min_length=5, description="Original copy to review")

class ReviewStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(Draft|In Review|Changes Requested|Approved)$")

class ReviewApplySuggestion(BaseModel):
    issue_id: int
    action: str = Field(..., pattern="^(accept|reject)$")

class ReviewContentUpdate(BaseModel):
    revised_content: str = Field(..., min_length=1)

class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    brand_id: int
    brand_name: Optional[str] = None
    content_title: str
    content_type: str
    original_content: str
    revised_content: str
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    total_issues: int = 0
    high_issues: int = 0
    medium_issues: int = 0
    low_issues: int = 0
    unverified_claims: int = 0

class ReviewDetailResponse(ReviewResponse):
    issues: List[ReviewIssueResponse] = []
    brand: Optional[BrandBase] = None


# --- Dashboard Stats ---
class SeverityBreakdown(BaseModel):
    high: int = 0
    medium: int = 0
    low: int = 0

class StatusBreakdown(BaseModel):
    draft: int = 0
    in_review: int = 0
    changes_requested: int = 0
    approved: int = 0

class DashboardStatsResponse(BaseModel):
    total_reviews: int
    total_detected_issues: int
    pending_reviews: int
    approved_content: int
    severity_breakdown: SeverityBreakdown
    status_breakdown: StatusBreakdown
    unverified_claims_count: int


# --- Health ---
class HealthResponse(BaseModel):
    status: str
    database: str
    ai_engine_mode: str
    gemini_configured: bool
    app_name: str
    version: str = "1.0.0"
