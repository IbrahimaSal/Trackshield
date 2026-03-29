from src.domain.rgpd_scorer import compute_score


def test_score_a_clean_site() -> None:
    result = compute_score(0, 0, 0, 0.0)
    assert result.grade == "A"
    assert result.score >= 90


def test_score_f_heavy_tracking() -> None:
    result = compute_score(20, 5, 30, 1.0)
    assert result.grade == "F"


def test_score_d_moderate() -> None:
    result = compute_score(8, 2, 5, 0.8)
    assert result.grade in ("D", "F")


def test_breakdown_sums_correctly() -> None:
    result = compute_score(3, 1, 2, 0.5)
    assert 0 <= result.score <= 100
