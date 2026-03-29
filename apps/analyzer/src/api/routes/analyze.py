from fastapi import APIRouter
from src.api.schemas import AnalyzeRequest, AnalyzeResponse, PiiMatchSchema
from src.adapters.regex_pii_detector import RegexPiiDetector

router = APIRouter()
detector = RegexPiiDetector()


@router.post("")
async def analyze(req: AnalyzeRequest) -> AnalyzeResponse:
    matches = detector.detect(req.url, req.body)
    return AnalyzeResponse(
        piis=[PiiMatchSchema(type=m.type.value, masked_value=m.masked_value, destination=m.destination) for m in matches]
    )
