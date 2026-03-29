from dataclasses import dataclass
from enum import Enum


class PiiType(str, Enum):
    TEL = "TEL"
    EMAIL = "EMAIL"
    COMPORTEMENT = "COMPORTEMENT"
    ID_PUB = "ID_PUB"
    DEVICE = "DEVICE"
    LOC = "LOC"


class TrackerCategory(str, Enum):
    ADVERTISING = "advertising"
    ANALYTICS = "analytics"
    SOCIAL = "social"
    FINGERPRINTING = "fingerprinting"


@dataclass
class PiiMatch:
    type: PiiType
    masked_value: str
    destination: str


@dataclass
class TrackerMatch:
    domain: str
    category: TrackerCategory
    company: str


@dataclass
class ScoreBreakdown:
    trackers: float
    pii: float
    cookies: float
    destinations: float


@dataclass
class RgpdScore:
    grade: str
    score: float
    breakdown: ScoreBreakdown
