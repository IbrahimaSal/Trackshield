from fastapi import APIRouter
from src.api.schemas import ReportRequest, ReportResponse, TrackerMatchSchema, PiiMatchSchema
from src.domain.models import TrackerMatch, TrackerCategory, PiiMatch, PiiType
from src.domain.report_generator import generate_report

router = APIRouter()


@router.post("", response_model=ReportResponse)
async def generate_report_route(req: ReportRequest) -> ReportResponse:
    trackers = [
        TrackerMatch(
            domain=t.domain,
            category=TrackerCategory(t.category),
            company=t.company,
        )
        for t in req.trackers
    ]

    piis = [
        PiiMatch(
            type=PiiType(p.type),
            masked_value=p.masked_value,
            destination=p.destination,
        )
        for p in req.piis
    ]

    report = generate_report(
        url=req.url,
        trackers=trackers,
        piis=piis,
        cookie_count=req.cookie_count,
        non_eu_destination_ratio=req.non_eu_destination_ratio,
    )

    return ReportResponse(
        url=report.url,
        grade=report.grade,
        score=report.score,
        trackers=[
            TrackerMatchSchema(domain=t.domain, category=t.category.value, company=t.company)
            for t in report.trackers
        ],
        piis=[
            PiiMatchSchema(type=p.type.value, masked_value=p.masked_value, destination=p.destination)
            for p in report.piis
        ],
        summary=report.summary,
        recommendations=report.recommendations,
    )
