import sqlite3
import unittest
from analytics.pipeline import load
E={"id":"e1","user_id":"u1","started_at":"2026-10-22T12:00:00Z","sport":"run","distance_m":2000,"duration_s":600}
class TestETL(unittest.TestCase):
 def test_dedup_and_aggregate(self):
  with sqlite3.connect(":memory:") as db:
   self.assertEqual(load(db,[E,E],"0123456789abcdef")["inserted"],1)
   self.assertEqual(db.execute("SELECT sessions,meters FROM daily").fetchone(),(1,2000))
 def test_reject_invalid(self):
  with sqlite3.connect(":memory:") as db:
   self.assertEqual(load(db,[dict(E,distance_m=-1)],"0123456789abcdef")["rejected"],1)
if __name__=="__main__":unittest.main()
