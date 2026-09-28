import numpy as np
import pandas as pd
import pytest

from pace_benchmark import FEATURES, evaluate, group_splits, load_consented


def fixture():
    rng = np.random.default_rng(42)
    n = 120
    df = pd.DataFrame({
        "user_id": [f"test-{i//6}" for i in range(n)],
        "started_at": pd.date_range("2026-01-01", periods=n, freq="h").astype(str),
        "distance_m": rng.uniform(1500, 15000, n),
        "elevation_gain_m": rng.uniform(0, 150, n),
        "recent_28d_pace_sec_per_km": rng.uniform(250, 480, n),
    })
    df["pace_sec_per_km"] = df["recent_28d_pace_sec_per_km"] + rng.normal(0, 10, n)
    return df


def test_grouped_holdout_and_baselines(tmp_path):
    df = fixture()
    csv = tmp_path / "consented.csv"
    df.to_csv(csv, index=False)
    clean, digest = load_consented(csv)
    a, b, c = group_splits(clean)
    assert not (set(a.user_id) & set(b.user_id) | set(b.user_id) & set(c.user_id) |
                set(a.user_id) & set(c.user_id))
    assert sum(map(len, (a, b, c))) == len(clean)
    model, report = evaluate(clean, dataset_sha256=digest)
    assert report["test_rows"] == len(c)
    assert "prior_28d_pace_baseline" in report["validation_mae_sec_per_km"]
    assert report["test_mae_sec_per_km"] >= 0


def test_missing_consent_contract_fails(tmp_path):
    df = fixture().drop(columns=[FEATURES[0]])
    csv = tmp_path / "invalid.csv"
    df.to_csv(csv, index=False)
    with pytest.raises(ValueError, match="Missing columns"):
        load_consented(csv)
