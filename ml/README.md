# TRACE expected-run-pace benchmark

**Implemented (experimental):** a reproducible Python pipeline for one well-defined prediction task: expected running pace in seconds/km, compared against mean and previous-28-day-pace baselines. It uses a deterministic user-disjoint train/validation/test holdout; model selection is validation-only. Tests use explicitly synthetic fixtures and run in CI.

**Not yet demonstrated:** actual model performance on user-consented data, mobile integration, online inference, or representative predictive quality. Do not treat the tests as empirical performance. This remains a research pipeline until such data are available.

## Data contract and consent

Bring your own explicitly opt-in, de-identified CSV, kept outside Git. Required columns: `user_id` (non-reversible random identifier), `started_at` (UTC), `distance_m`, `elevation_gain_m`, `recent_28d_pace_sec_per_km`, `pace_sec_per_km` (observed target). Include completed runs only; never upload raw GPS trajectories or real account identifiers. The prior-28-day pace must be computed using **only activities before each row's start time**; otherwise the model leaks future outcomes. Revoke/delete inputs according to the user's consent. The pipeline requires at least ten consenting users. Supplying an external dataset is an explicit user/operator step: automated fixture tests do not represent a real benchmark.

```bash
python -m pip install -r ml/requirements.txt
cd ml
pytest -q test_pace_benchmark.py
python pace_benchmark.py --csv /secure/consented_runs.csv --output artifacts
```

The produced `evaluation.json` contains the dataset byte SHA-256, chosen candidate, validation MAE, held-out test MAE/RMSE and partition sizes. The selected sklearn model (if an ML candidate beats the baseline) is stored as a **trusted local** joblib artifact. Do not load arbitrary joblib files. Neither user data nor results are automatically uploaded. Remaining work: consent collection, historical as-of feature generation, quality checks across runner cohorts, on-device/server inference and integration into TRACE Intelligence. Predictions are guidance, never a health or safety decision.
