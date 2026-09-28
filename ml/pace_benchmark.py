"""User-disjoint expected-run-pace benchmark, requiring explicitly consented data."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.dummy import DummyRegressor
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

FEATURES = ["planned_distance_m", "planned_elevation_gain_m", "recent_28d_pace_sec_per_km"]
REQUIRED = ["user_id", "started_at", "feature_window_end_at", *FEATURES, "pace_sec_per_km"]
SEED = 42


def load_consented(csv: Path) -> tuple[pd.DataFrame, str]:
    """Never silently load user location/fitness data from application storage."""
    raw = csv.read_bytes()
    frame = pd.read_csv(csv, dtype={"user_id": "string"})
    if set(REQUIRED) - set(frame):
        raise ValueError("Missing columns: " + str(sorted(set(REQUIRED) - set(frame))))
    frame = frame[REQUIRED].copy()
    if frame["user_id"].isna().any() or frame["user_id"].eq("").any():
        raise ValueError("Missing de-identified user IDs")
    frame["started_at"] = pd.to_datetime(frame["started_at"], utc=True, errors="raise")
    frame["feature_window_end_at"] = pd.to_datetime(
        frame["feature_window_end_at"], utc=True, errors="raise"
    )
    if (frame["feature_window_end_at"] >= frame["started_at"]).any():
        raise ValueError("Historical pace feature window must end before run starts")
    for field in [*FEATURES, "pace_sec_per_km"]:
        frame[field] = pd.to_numeric(frame[field], errors="raise")
    if frame.isna().any().any() or not np.isfinite(frame[[*FEATURES, "pace_sec_per_km"]]).all().all():
        raise ValueError("Missing/non-finite values")
    if (frame[["planned_distance_m", "pace_sec_per_km", "recent_28d_pace_sec_per_km"]] <= 0).any().any():
        raise ValueError("Distance and pace values must be positive")
    if (frame["planned_elevation_gain_m"] < 0).any():
        raise ValueError("Elevation gain must be non-negative")
    if frame["user_id"].nunique() < 10:
        raise ValueError("Need >=10 different consented users for group holdout")
    return frame, hashlib.sha256(raw).hexdigest()


def group_splits(frame: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Different users in every partition; labels from one user never train another's test."""
    groups = frame["user_id"]
    first = GroupShuffleSplit(n_splits=1, test_size=.20, random_state=SEED)
    rest_idx, test_idx = next(first.split(frame, groups=groups))
    rest = frame.iloc[rest_idx]
    second = GroupShuffleSplit(n_splits=1, test_size=.25, random_state=SEED)
    train_idx, val_idx = next(second.split(rest, groups=rest["user_id"]))
    train, val, test = rest.iloc[train_idx], rest.iloc[val_idx], frame.iloc[test_idx]
    sets = [set(item["user_id"]) for item in (train, val, test)]
    if any(sets[i] & sets[j] for i in range(3) for j in range(i + 1, 3)):
        raise ValueError("User group leakage")
    return train, val, test


def evaluate(frame: pd.DataFrame, *, dataset_sha256: str) -> tuple[object, dict]:
    train, val, test = group_splits(frame)
    candidates = {
        "mean_baseline": DummyRegressor(strategy="mean"),
        "ridge": make_pipeline(StandardScaler(), Ridge(alpha=10.0)),
        "hist_gradient_boosting": HistGradientBoostingRegressor(
            max_iter=80, max_leaf_nodes=7, l2_regularization=1.0, random_state=SEED
        ),
    }
    fitted, val_metrics = {}, {}
    for name, model in candidates.items():
        model.fit(train[FEATURES], train["pace_sec_per_km"])
        fitted[name] = model
        predictions = model.predict(val[FEATURES])
        val_metrics[name] = float(mean_absolute_error(val["pace_sec_per_km"], predictions))
    # Product-statistical baseline: a runner's *prior* 28-day pace, never their current result.
    val_metrics["prior_28d_pace_baseline"] = float(mean_absolute_error(
        val["pace_sec_per_km"], val["recent_28d_pace_sec_per_km"]
    ))
    winner = min(val_metrics, key=val_metrics.get)
    if winner == "prior_28d_pace_baseline":
        model = None
        predictions = test["recent_28d_pace_sec_per_km"].to_numpy()
    else:
        model = fitted[winner]
        predictions = model.predict(test[FEATURES])
    report = {
        "dataset_sha256": dataset_sha256,
        "data_classification": "operator_supplied_consent_attestation_unverified",
        "split": "user_disjoint_60_20_20_approx",
        "seed": SEED,
        "features": FEATURES,
        "train_users": int(train["user_id"].nunique()),
        "validation_users": int(val["user_id"].nunique()),
        "test_users": int(test["user_id"].nunique()),
        "validation_mae_sec_per_km": val_metrics,
        "selected": winner,
        "test_mae_sec_per_km": float(mean_absolute_error(test["pace_sec_per_km"], predictions)),
        "test_rmse_sec_per_km": float(np.sqrt(mean_squared_error(
            test["pace_sec_per_km"], predictions
        ))),
        "test_rows": len(test),
        "limitations": [
            "Feature window end is checked before each run; upstream historical feature provenance remains operator responsibility.",
            "Planned route features must not use actual post-run route observations.",
            "Not a clinical, safety, or training recommendation.",
            "Generalization beyond consented runner population not established.",
        ],
    }
    return model, report


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", type=Path, required=True, help="Opt-in deidentified local CSV")
    parser.add_argument("--output", type=Path, default=Path("ml/artifacts"))
    args = parser.parse_args()
    frame, checksum = load_consented(args.csv)
    model, report = evaluate(frame, dataset_sha256=checksum)
    args.output.mkdir(parents=True, exist_ok=True)
    if model is not None:
        joblib.dump(model, args.output / "pace.joblib")
    (args.output / "evaluation.json").write_text(
        json.dumps(report, indent=2, allow_nan=False) + "\n", encoding="utf8"
    )
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
