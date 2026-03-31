import pytest
from src.domain.report_generator import generate_report, AuditReport
from src.domain.models import PiiMatch, PiiType, TrackerMatch, TrackerCategory


TRACKER_GOOGLE = TrackerMatch(domain="google-analytics.com", category=TrackerCategory.ANALYTICS, company="Google")
TRACKER_FB = TrackerMatch(domain="facebook.com", category=TrackerCategory.SOCIAL, company="Meta")
PII_EMAIL = PiiMatch(type=PiiType.EMAIL, masked_value="j••••@gmail.com", destination="google.com")
PII_PHONE = PiiMatch(type=PiiType.TEL, masked_value="+33••••••••••", destination="meta.com")


class TestGenerateReport:
    def test_retourne_un_rapport_avec_le_grade_et_score_corrects(self) -> None:
        report = generate_report(
            url="https://example.com",
            trackers=[TRACKER_GOOGLE],
            piis=[],
            cookie_count=2,
            non_eu_destination_ratio=0.0,
        )
        assert report.grade in ("A", "B", "C", "D", "F")
        assert 0.0 <= report.score <= 100.0

    def test_retourne_la_liste_des_trackers_detectes(self) -> None:
        report = generate_report(
            url="https://example.com",
            trackers=[TRACKER_GOOGLE, TRACKER_FB],
            piis=[],
            cookie_count=0,
            non_eu_destination_ratio=0.0,
        )
        assert len(report.trackers) == 2
        assert report.trackers[0].domain == "google-analytics.com"

    def test_retourne_les_pii_masquees_jamais_en_clair(self) -> None:
        report = generate_report(
            url="https://example.com",
            trackers=[],
            piis=[PII_EMAIL, PII_PHONE],
            cookie_count=0,
            non_eu_destination_ratio=0.0,
        )
        assert len(report.piis) == 2
        for pii in report.piis:
            assert "•" in pii.masked_value, "La valeur PII doit être masquée"

    def test_le_resume_mentionne_le_nombre_de_trackers(self) -> None:
        report = generate_report(
            url="https://example.com",
            trackers=[TRACKER_GOOGLE, TRACKER_FB],
            piis=[],
            cookie_count=0,
            non_eu_destination_ratio=0.0,
        )
        assert "2" in report.summary

    def test_le_resume_mentionne_le_nombre_de_pii(self) -> None:
        report = generate_report(
            url="https://example.com",
            trackers=[],
            piis=[PII_EMAIL],
            cookie_count=0,
            non_eu_destination_ratio=0.0,
        )
        assert "1" in report.summary

    def test_les_recommandations_sont_presentes_quand_il_y_a_des_trackers(self) -> None:
        report = generate_report(
            url="https://example.com",
            trackers=[TRACKER_GOOGLE],
            piis=[],
            cookie_count=0,
            non_eu_destination_ratio=0.0,
        )
        assert len(report.recommendations) > 0

    def test_le_rapport_sans_trackers_ni_pii_a_un_score_eleve(self) -> None:
        report = generate_report(
            url="https://example.com",
            trackers=[],
            piis=[],
            cookie_count=0,
            non_eu_destination_ratio=0.0,
        )
        assert report.score >= 90.0
        assert report.grade == "A"

    def test_le_rapport_expose_lurl_auditee(self) -> None:
        report = generate_report(
            url="https://target.com",
            trackers=[],
            piis=[],
            cookie_count=0,
            non_eu_destination_ratio=0.0,
        )
        assert report.url == "https://target.com"

    def test_le_rapport_serialise_en_dict_sans_dict_nu(self) -> None:
        report = generate_report(
            url="https://example.com",
            trackers=[TRACKER_GOOGLE],
            piis=[PII_EMAIL],
            cookie_count=1,
            non_eu_destination_ratio=0.5,
        )
        assert isinstance(report, AuditReport)
        assert hasattr(report, "grade")
        assert hasattr(report, "score")
        assert hasattr(report, "trackers")
        assert hasattr(report, "piis")
        assert hasattr(report, "summary")
        assert hasattr(report, "recommendations")
