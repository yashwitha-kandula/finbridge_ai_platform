from fastapi import FastAPI

app = FastAPI(
    title="FinBridge AI API",
    description="Backend API for FinBridge AI",
    version="1.0.0"
)


# -------------------------
# HOME
# -------------------------

@app.get("/")
def home():
    return {
        "message": "Welcome to FinBridge AI",
        "status": "Backend is running"
    }


# -------------------------
# HEALTH CHECK
# -------------------------

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "FinBridge AI Backend"
    }


# -------------------------
# PROJECT INFORMATION
# -------------------------

@app.get("/project")
def project_info():
    return {
        "project_name": "FinBridge AI",
        "project_type": "AI-powered Personal Finance Management System",
        "stage": "Development"
    }


# -------------------------
# API VERSION
# -------------------------

@app.get("/version")
def api_version():
    return {
        "api_version": "1.0.0",
        "status": "development"
    }