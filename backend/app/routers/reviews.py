from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Brand, Review, ReviewIssue
from app.schemas import (
    ReviewCreate, ReviewResponse, ReviewDetailResponse,
    ReviewStatusUpdate, ReviewApplySuggestion, ReviewContentUpdate,
    DashboardStatsResponse, SeverityBreakdown, StatusBreakdown,
    BrandBase, ReviewIssueResponse
)
from app.services.review_engine import review_engine

router = APIRouter(tags=["Reviews"])

@router.post("/api/reviews", response_model=ReviewDetailResponse, status_code=status.HTTP_201_CREATED)
async def submit_content_review(review_in: ReviewCreate, db: Session = Depends(get_db)):
    """
    Module B & C: Submit marketing content for AI & rule-based compliance analysis.
    Validates brand rules, executes governance review, and stores issues and initial draft.
    """
    brand = db.query(Brand).filter(Brand.id == review_in.brand_id).first()
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Brand with ID {review_in.brand_id} does not exist."
        )

    # Run Compliance Analysis Engine
    detected_issues = await review_engine.analyze(
        content_text=review_in.content_text,
        content_type=review_in.content_type,
        brand=brand
    )

    # Initial status: "In Review" if issues found, else "Approved"
    initial_status = "In Review" if detected_issues else "Approved"

    # Create Review Record (Preserving original content unchanged)
    review = Review(
        brand_id=brand.id,
        content_title=review_in.content_title.strip(),
        content_type=review_in.content_type,
        original_content=review_in.content_text,
        revised_content=review_in.content_text,
        status=initial_status
    )
    db.add(review)
    db.flush()

    # Store detected issues
    for issue_data in detected_issues:
        issue = ReviewIssue(
            review_id=review.id,
            category=issue_data.get("category", "General Compliance"),
            severity=issue_data.get("severity", "Medium"),
            problematic_text=issue_data.get("problematic_text", ""),
            explanation=issue_data.get("explanation", ""),
            supporting_evidence=issue_data.get("supporting_evidence"),
            suggested_correction=issue_data.get("suggested_correction", ""),
            verification_status=issue_data.get("verification_status", "Needs Human Review"),
            is_accepted=None
        )
        db.add(issue)

    db.commit()
    db.refresh(review)

    return _build_review_detail_response(review)

@router.get("/api/reviews", response_model=List[ReviewResponse])
def list_reviews(
    brand_id: Optional[int] = Query(None, description="Filter by brand"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by review status"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """
    List content review history with computed statistics.
    """
    query = db.query(Review)
    if brand_id:
        query = query.filter(Review.brand_id == brand_id)
    if status_filter:
        query = query.filter(Review.status == status_filter)

    reviews = query.order_by(Review.created_at.desc()).limit(limit).all()
    
    results = []
    for r in reviews:
        results.append(_build_review_summary_response(r))
    return results

@router.get("/api/reviews/{review_id}", response_model=ReviewDetailResponse)
def get_review_detail(review_id: int, db: Session = Depends(get_db)):
    """
    Retrieve full review details including all detected compliance issues and revision draft.
    """
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Review #{review_id} not found.")
    return _build_review_detail_response(review)

@router.patch("/api/reviews/{review_id}/status", response_model=ReviewDetailResponse)
def update_review_status(review_id: int, status_update: ReviewStatusUpdate, db: Session = Depends(get_db)):
    """
    Module F: Human Review Workflow - manually update review status.
    Statuses: 'Draft', 'In Review', 'Changes Requested', 'Approved'
    """
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found.")

    review.status = status_update.status
    db.commit()
    db.refresh(review)
    return _build_review_detail_response(review)

@router.post("/api/reviews/{review_id}/apply-suggestion", response_model=ReviewDetailResponse)
def apply_suggestion(review_id: int, payload: ReviewApplySuggestion, db: Session = Depends(get_db)):
    """
    Module E: Accept or reject a specific suggestion.
    Accepting modifies revised_content without modifying original_content.
    Rejecting records the human decision.
    """
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found.")

    issue = db.query(ReviewIssue).filter(
        ReviewIssue.id == payload.issue_id,
        ReviewIssue.review_id == review_id
    ).first()

    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found in this review.")

    if payload.action == "accept":
        issue.is_accepted = True
        # Apply replacement into revised_content
        if issue.problematic_text in review.revised_content:
            review.revised_content = review.revised_content.replace(
                issue.problematic_text,
                issue.suggested_correction,
                1
            )
    else:
        issue.is_accepted = False

    db.commit()
    db.refresh(review)
    return _build_review_detail_response(review)

@router.put("/api/reviews/{review_id}/content", response_model=ReviewDetailResponse)
def update_revised_content(review_id: int, payload: ReviewContentUpdate, db: Session = Depends(get_db)):
    """
    Module E: Allow human reviewers to manually edit and polish revised content.
    """
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found.")

    review.revised_content = payload.revised_content
    db.commit()
    db.refresh(review)
    return _build_review_detail_response(review)

@router.delete("/api/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(review_id: int, db: Session = Depends(get_db)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found.")
    db.delete(review)
    db.commit()
    return None

@router.get("/api/dashboard/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Real database analytics computed from actual records.
    Never fabricated or hardcoded.
    """
    total_reviews = db.query(func.count(Review.id)).scalar() or 0
    total_issues = db.query(func.count(ReviewIssue.id)).scalar() or 0

    pending_reviews = db.query(func.count(Review.id)).filter(
        Review.status.in_(["Draft", "In Review", "Changes Requested"])
    ).scalar() or 0

    approved_content = db.query(func.count(Review.id)).filter(
        Review.status == "Approved"
    ).scalar() or 0

    high_issues = db.query(func.count(ReviewIssue.id)).filter(
        ReviewIssue.severity == "High"
    ).scalar() or 0

    medium_issues = db.query(func.count(ReviewIssue.id)).filter(
        ReviewIssue.severity == "Medium"
    ).scalar() or 0

    low_issues = db.query(func.count(ReviewIssue.id)).filter(
        ReviewIssue.severity == "Low"
    ).scalar() or 0

    unverified_count = db.query(func.count(ReviewIssue.id)).filter(
        ReviewIssue.verification_status.in_(["Unverified Statement", "Unsupported Claim", "Needs Human Review"])
    ).scalar() or 0

    draft_count = db.query(func.count(Review.id)).filter(Review.status == "Draft").scalar() or 0
    in_review_count = db.query(func.count(Review.id)).filter(Review.status == "In Review").scalar() or 0
    changes_requested_count = db.query(func.count(Review.id)).filter(Review.status == "Changes Requested").scalar() or 0

    return DashboardStatsResponse(
        total_reviews=total_reviews,
        total_detected_issues=total_issues,
        pending_reviews=pending_reviews,
        approved_content=approved_content,
        severity_breakdown=SeverityBreakdown(
            high=high_issues,
            medium=medium_issues,
            low=low_issues
        ),
        status_breakdown=StatusBreakdown(
            draft=draft_count,
            in_review=in_review_count,
            changes_requested=changes_requested_count,
            approved=approved_content
        ),
        unverified_claims_count=unverified_count
    )

def _build_review_summary_response(r: Review) -> ReviewResponse:
    total = len(r.issues)
    high = sum(1 for i in r.issues if i.severity == "High")
    med = sum(1 for i in r.issues if i.severity == "Medium")
    low = sum(1 for i in r.issues if i.severity == "Low")
    unverified = sum(1 for i in r.issues if i.verification_status in ["Unverified Statement", "Unsupported Claim", "Needs Human Review"])

    return ReviewResponse(
        id=r.id,
        brand_id=r.brand_id,
        brand_name=r.brand.name if r.brand else "Unknown Brand",
        content_title=r.content_title,
        content_type=r.content_type,
        original_content=r.original_content,
        revised_content=r.revised_content,
        status=r.status,
        created_at=r.created_at,
        updated_at=r.updated_at,
        total_issues=total,
        high_issues=high,
        medium_issues=med,
        low_issues=low,
        unverified_claims=unverified
    )

def _build_review_detail_response(r: Review) -> ReviewDetailResponse:
    summary = _build_review_summary_response(r)
    brand_data = BrandBase.model_validate(r.brand) if r.brand else None
    return ReviewDetailResponse(
        **summary.model_dump(),
        issues=[ReviewIssueResponse.model_validate(i) for i in r.issues],
        brand=brand_data
    )
