from fastapi import APIRouter
from src.api.schemas import ScoreRequest, ScoreResponse, ScoreBreakdownSchema
from src.domain.rgpd_scorer import compute_score

router = APIRouter()


@router.post("")
async def score(req: ScoreRequest) -> ScoreResponse:
    result = compute_score(
        tracker_count=req.tracker_count,
        pii_count=req.pii_count,
        cookie_count=req.cookie_count,
        non_eu_destination_ratio=req.non_eu_destination_ratio,
    )
    return ScoreResponse(
        grade=result.grade,
        score=result.score,
        breakdown=ScoreBreakdownSchema(
            trackers=result.breakdown.trackers,
            pii=result.breakdown.pii,
            cookies=result.breakdown.cookies,
            destinations=result.breakdown.destinations,
        ),
    )
