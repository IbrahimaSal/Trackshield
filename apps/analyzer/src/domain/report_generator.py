from dataclasses import dataclass, field
from src.domain.models import PiiMatch, TrackerMatch
from src.domain.rgpd_scorer import compute_score


@dataclass
class AuditReport:
    url: str
    grade: str
    score: float
    trackers: list[TrackerMatch]
    piis: list[PiiMatch]
    summary: str
    recommendations: list[str]


def _generate_summary(
    url: str,
    tracker_count: int,
    pii_count: int,
    cookie_count: int,
    grade: str,
    score: float,
) -> str:
    return (
        f"Audit RGPD de {url} : score {score:.1f}/100 (grade {grade}). "
        f"{tracker_count} tracker(s) détecté(s), {pii_count} donnée(s) personnelle(s) exposée(s), "
        f"{cookie_count} cookie(s) comptabilisé(s)."
    )


def _generate_recommendations(
    tracker_count: int,
    pii_count: int,
    cookie_count: int,
    non_eu_destination_ratio: float,
) -> list[str]:
    recs: list[str] = []

    if tracker_count > 0:
        recs.append(
            f"Réduire le nombre de trackers ({tracker_count} détectés). "
            "Préférez des alternatives respectueuses de la vie privée (Matomo auto-hébergé, Plausible)."
        )

    if pii_count > 0:
        recs.append(
            f"{pii_count} donnée(s) personnelle(s) transmise(s) à des tiers. "
            "Auditez les formulaires et paramètres d'URL pour éviter la fuite de données."
        )

    if cookie_count > 3:
        recs.append(
            f"{cookie_count} cookies détectés. Assurez-vous d'avoir un bandeau de consentement conforme au RGPD."
        )

    if non_eu_destination_ratio > 0.5:
        recs.append(
            f"{non_eu_destination_ratio * 100:.0f}% des données partent hors UE. "
            "Vérifiez les clauses de transfert (SCCs, adequacy decisions)."
        )

    return recs


def generate_report(
    url: str,
    trackers: list[TrackerMatch],
    piis: list[PiiMatch],
    cookie_count: int,
    non_eu_destination_ratio: float,
) -> AuditReport:
    rgpd_score = compute_score(
        tracker_count=len(trackers),
        pii_count=len(piis),
        cookie_count=cookie_count,
        non_eu_destination_ratio=non_eu_destination_ratio,
    )

    summary = _generate_summary(
        url=url,
        tracker_count=len(trackers),
        pii_count=len(piis),
        cookie_count=cookie_count,
        grade=rgpd_score.grade,
        score=rgpd_score.score,
    )

    recommendations = _generate_recommendations(
        tracker_count=len(trackers),
        pii_count=len(piis),
        cookie_count=cookie_count,
        non_eu_destination_ratio=non_eu_destination_ratio,
    )

    return AuditReport(
        url=url,
        grade=rgpd_score.grade,
        score=rgpd_score.score,
        trackers=trackers,
        piis=piis,
        summary=summary,
        recommendations=recommendations,
    )
