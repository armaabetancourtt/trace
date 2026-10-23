"""Optional Airflow orchestration. Requires Airflow and local Spark setup."""
from datetime import datetime
from airflow import DAG
from airflow.operators.bash import BashOperator
with DAG("trace_daily_analytics",start_date=datetime(2026,1,1),schedule="@daily",
         catchup=False,max_active_runs=1,tags=["trace","analytics"]) as dag:
    build=BashOperator(task_id="aggregate",bash_command=(
        "test -n \"$TRACE_EXPORT_INPUT\" && test -n \"$TRACE_ANALYTICS_OUTPUT\" && "
        "spark-submit analytics/spark_daily.py --input \"$TRACE_EXPORT_INPUT\" "
        "--output \"$TRACE_ANALYTICS_OUTPUT\""))
