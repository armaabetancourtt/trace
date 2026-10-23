import unittest
try:
 from pyspark.sql import SparkSession
 from analytics.spark_daily import build_daily
except ImportError:
 SparkSession=None
@unittest.skipUnless(SparkSession is not None,"Spark optional")
class SparkDailyTests(unittest.TestCase):
 def test_batch_aggregations(self):
  import tempfile,json
  with tempfile.TemporaryDirectory() as td:
   path=td+"/events.jsonl"
   events=[{"id":"1","user_id":"u","started_at":"2026-01-01T10:00:00Z","sport":"run","distance_m":2000.0,"duration_s":600},
   {"id":"2","user_id":"u","started_at":"2026-01-01T11:00:00Z","sport":"run","distance_m":1000.0,"duration_s":300}]
   with open(path,"w") as f:
    for e in events:f.write(json.dumps(e)+"\n")
   spark=SparkSession.builder.master("local[1]").appName("trace-tests").getOrCreate()
   try:
    result=build_daily(spark,path).collect()
    self.assertEqual(len(result),1)
    self.assertEqual(result[0]["sessions"],2)
    self.assertEqual(result[0]["distance_m"],3000.0)
   finally:spark.stop()
