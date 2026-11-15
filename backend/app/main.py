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
# Explicit origins required when allow_credentials=True per W3C CORS specification
cors_origins = settings.cors_origin_list
if not cors_origins:
    cors_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
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
