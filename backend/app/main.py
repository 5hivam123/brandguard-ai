from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.database import engine, Base
from app.routers import brands, reviews, health

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="BrandGuard AI API",
    description="Intelligent Brand Governance & Content Compliance Platform. "
                "Developed by Team Reverse Engg (Shivam Gupta, Uzma Nayab, Aaysha Shams).",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred.", "error": str(exc)}
    )

# Mount Routers
app.include_router(health.router)
app.include_router(brands.router)
app.include_router(reviews.router)

@app.get("/")
def root():
    return {
        "app": "BrandGuard AI",
        "tagline": "Create Freely. Publish Confidently.",
        "team": "Reverse Engg",
        "members": ["Shivam Gupta", "Uzma Nayab", "Aaysha Shams"],
        "docs_url": "/docs",
        "health_url": "/api/health"
    }
