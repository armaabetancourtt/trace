"""Privacy-first, idempotent activity metadata ETL."""
import hashlib
import json
import sqlite3
from datetime import datetime, timezone

SCHEMA="""CREATE TABLE IF NOT EXISTS activities(
 event_id TEXT PRIMARY KEY, athlete_key TEXT NOT NULL, day_utc TEXT NOT NULL,
 sport TEXT NOT NULL CHECK(sport IN ('run','walk','cycle')),
 distance_m REAL NOT NULL CHECK(distance_m>=0),
 duration_s INTEGER NOT NULL CHECK(duration_s>0));
CREATE VIEW IF NOT EXISTS daily AS SELECT athlete_key,day_utc,sport,
 COUNT(*) sessions,SUM(distance_m) meters,SUM(duration_s) seconds
 FROM activities GROUP BY athlete_key,day_utc,sport;"""
def transform(event,salt):
    if len(salt)<16: raise ValueError("salt must be 16+ characters")
    timestamp=datetime.fromisoformat(event["started_at"].replace("Z","+00:00"))
    if timestamp.tzinfo is None: raise ValueError("timestamp must have timezone")
    sport=event["sport"]
    meters=float(event["distance_m"])
    seconds=int(event["duration_s"])
    if sport not in ("run","walk","cycle") or not 0<=meters<=500000 or not 0<seconds<=86400:
        raise ValueError("invalid activity")
    key=hashlib.sha256((salt+":"+str(event["user_id"])).encode()).hexdigest()
    return str(event["id"]),key,timestamp.astimezone(timezone.utc).date().isoformat(),sport,meters,seconds
def load(db,events,salt):
    db.executescript(SCHEMA)
    accepted=rejected=0
    for event in events:
        try: accepted+=db.execute("INSERT OR IGNORE INTO activities VALUES(?,?,?,?,?,?)",transform(event,salt)).rowcount
        except (KeyError,TypeError,ValueError): rejected+=1
    db.commit()
    return {"inserted":accepted,"rejected":rejected}
def main():
    import argparse,os
    p=argparse.ArgumentParser()
    p.add_argument("--input",required=True)
    p.add_argument("--db",default="analytics.sqlite")
    a=p.parse_args()
    with sqlite3.connect(a.db) as db,open(a.input,encoding="utf8") as f:
        print(json.dumps(load(db,(json.loads(line) for line in f if line.strip()),os.environ["TRACE_ANALYTICS_SALT"])))
if __name__=="__main__":main()
