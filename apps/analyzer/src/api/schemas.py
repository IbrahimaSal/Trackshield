from pydantic import BaseModel


class AnalyzeRequest(BaseModel):
    url: str
    body: str | None = None


class PiiMatchSchema(BaseModel):
    type: str
    masked_value: str
    destination: str


class AnalyzeResponse(BaseModel):
    piis: list[PiiMatchSchema]


class ScoreRequest(BaseModel):
    tracker_count: int
    pii_count: int
    cookie_count: int
    non_eu_destination_ratio: float


class ScoreBreakdownSchema(BaseModel):
    trackers: float
    pii: float
    cookies: float
    destinations: float


class ScoreResponse(BaseModel):
    grade: str
    score: float
    breakdown: ScoreBreakdownSchema
