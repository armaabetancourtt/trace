"""Spark batch transformation for the same TRACE activity export contract."""
from pyspark.sql import functions as F, types as T
def build_daily(spark, source):
    schema=T.StructType([
      T.StructField("id",T.StringType()),T.StructField("user_id",T.StringType()),
      T.StructField("started_at",T.StringType()),T.StructField("sport",T.StringType()),
      T.StructField("distance_m",T.DoubleType()),T.StructField("duration_s",T.IntegerType())])
    raw=spark.read.schema(schema).json(source)
    clean=(raw.filter(F.col("id").isNotNull() & F.col("user_id").isNotNull())
      .filter(F.col("sport").isin("run","walk","cycle"))
      .filter(F.col("distance_m").between(0,500000) & F.col("duration_s").between(1,86400))
      .withColumn("day_utc",F.to_date(F.to_utc_timestamp(F.to_timestamp("started_at"),"UTC")))
      .filter(F.col("day_utc").isNotNull()).dropDuplicates(["id"]))
    return clean.groupBy("day_utc","sport").agg(F.count("*").alias("sessions"),
      F.sum("distance_m").alias("distance_m"),F.sum("duration_s").alias("duration_s"))
if __name__=="__main__":
    import argparse
    from pyspark.sql import SparkSession
    p=argparse.ArgumentParser();p.add_argument("--input",required=True);p.add_argument("--output",required=True)
    a=p.parse_args()
    spark=SparkSession.builder.appName("trace-daily").getOrCreate()
    try:build_daily(spark,a.input).write.mode("overwrite").parquet(a.output)
    finally:spark.stop()
