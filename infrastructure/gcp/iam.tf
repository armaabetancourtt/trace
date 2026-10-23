resource "google_service_account" "etl" {
  account_id = "trace-etl"
  display_name = "TRACE batch analytics"
}
resource "google_storage_bucket_iam_member" "etl_bucket_reader" {
  bucket = google_storage_bucket.lake.name
  role = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.etl.email}"
}
resource "google_bigquery_dataset_iam_member" "etl_dataset_writer" {
  dataset_id = google_bigquery_dataset.analytics.dataset_id
  role = "roles/bigquery.dataEditor"
  member = "serviceAccount:${google_service_account.etl.email}"
}
