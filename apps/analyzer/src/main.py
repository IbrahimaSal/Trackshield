from fastapi import FastAPI
from src.api.routes import analyze, score, report, health

app = FastAPI(title="Trackshield Analyzer", version="0.1.0")

app.include_router(health.router)
app.include_router(analyze.router, prefix="/analyze")
app.include_router(score.router, prefix="/score")
app.include_router(report.router, prefix="/report")
