# TRACE: private activity analytics (experimental)

Run `python3 -m unittest discover -s analytics -p 'test_*.py'`.

Input: newline-delimited JSON activity metadata with `id`, `user_id`, `started_at` (timezone-aware ISO-8601), `sport` (run/walk/cycle), `distance_m` and `duration_s`. Example:
```json
{"id":"e1","user_id":"test","started_at":"2026-10-22T12:00:00Z","sport":"run","distance_m":2000,"duration_s":600}
```

To ingest, set a private `TRACE_ANALYTICS_SALT` (16+ characters) and run `python3 -m analytics.pipeline --input activities.jsonl --db local.sqlite`. This **does not connect automatically to users' activities**. No raw GPS coordinates or user ID are persisted by this pipeline. Use user consent, restrictive permissions and deletion rules before any production use. This is a SQLite demonstration warehouse with idempotent load and daily SQL aggregate view, not a managed cloud deployment.

The existing Firebase application remains untouched. Planned scale path: permissioned export -> object storage -> Spark validation -> dbt on BigQuery. Neither Kafka, Spark, Airflow nor any cloud resources are provisioned here.
