import re
from src.domain.models import PiiMatch, PiiType
from src.domain.pii_detector_abc import PiiDetectorABC
from urllib.parse import urlparse


PII_PATTERNS: dict[PiiType, re.Pattern[str]] = {
    PiiType.EMAIL: re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"),
    PiiType.TEL: re.compile(r"(?:\+33|0033|0)[1-9](?:[0-9]{8}|\s[0-9]{2}(?:\s[0-9]{2}){3})"),
    PiiType.ID_PUB: re.compile(r"(?:_fbp|gclid|fbclid|_pinterest_ct_ua)=[^&\s]+"),
    PiiType.LOC: re.compile(r"(?:lat|lng|latitude|longitude)=[-\d.]+"),
}


def _mask(value: str, pii_type: PiiType) -> str:
    if pii_type == PiiType.EMAIL:
        at_idx = value.find("@")
        if at_idx <= 2:
            return f"{value[0]}••{value[at_idx:]}"
        return f"{value[:2]}••••{value[at_idx:]}"
    if pii_type == PiiType.TEL:
        return f"{value[:4]}••••{value[-4:]}"
    return f"{value[:4]}••••"


def _extract_domain(url: str) -> str:
    try:
        return urlparse(url).hostname or url
    except Exception:
        return url


class RegexPiiDetector(PiiDetectorABC):
    def detect(self, url: str, body: str | None = None) -> list[PiiMatch]:
        target = url + (body or "")
        destination = _extract_domain(url)
        matches: list[PiiMatch] = []

        for pii_type, pattern in PII_PATTERNS.items():
            for match in pattern.finditer(target):
                matches.append(PiiMatch(
                    type=pii_type,
                    masked_value=_mask(match.group(), pii_type),
                    destination=destination,
                ))

        return matches
