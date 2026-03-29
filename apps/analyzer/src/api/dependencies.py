from src.adapters.regex_pii_detector import RegexPiiDetector
from src.domain.pii_detector_abc import PiiDetectorABC


def get_pii_detector() -> PiiDetectorABC:
    return RegexPiiDetector()
