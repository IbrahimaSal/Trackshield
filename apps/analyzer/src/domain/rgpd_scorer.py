from src.domain.models import RgpdScore, ScoreBreakdown


WEIGHTS = {
    "trackers": 0.30,
    "pii": 0.35,
    "cookies": 0.20,
    "destinations": 0.15,
}

GRADE_THRESHOLDS = [
    (90, "A"),
    (75, "B"),
    (55, "C"),
    (35, "D"),
    (0,  "F"),
]


def compute_score(
    tracker_count: int,
    pii_count: int,
    cookie_count: int,
    non_eu_destination_ratio: float,
) -> RgpdScore:
    tracker_score = max(0.0, 100.0 - tracker_count * 5.0)
    pii_score = max(0.0, 100.0 - pii_count * 20.0)
    cookie_score = max(0.0, 100.0 - cookie_count * 3.0)
    destination_score = max(0.0, 100.0 - non_eu_destination_ratio * 100.0)

    total = (
        tracker_score * WEIGHTS["trackers"]
        + pii_score * WEIGHTS["pii"]
        + cookie_score * WEIGHTS["cookies"]
        + destination_score * WEIGHTS["destinations"]
    )

    grade = next(g for threshold, g in GRADE_THRESHOLDS if total >= threshold)

    return RgpdScore(
        grade=grade,
        score=round(total, 2),
        breakdown=ScoreBreakdown(
            trackers=round(tracker_score, 2),
            pii=round(pii_score, 2),
            cookies=round(cookie_score, 2),
            destinations=round(destination_score, 2),
        ),
    )
