from src.adapters.regex_pii_detector import RegexPiiDetector
from src.domain.models import PiiType


detector = RegexPiiDetector()


def test_detects_email() -> None:
    matches = detector.detect("https://pixel.facebook.com/track?email=john.doe@gmail.com")
    assert len(matches) == 1
    assert matches[0].type == PiiType.EMAIL
    assert "••" in matches[0].masked_value


def test_detects_french_phone() -> None:
    matches = detector.detect("https://example.com/api?phone=0612345678")
    assert len(matches) == 1
    assert matches[0].type == PiiType.TEL


def test_clean_url() -> None:
    matches = detector.detect("https://wikipedia.org/wiki/Privacy")
    assert len(matches) == 0
