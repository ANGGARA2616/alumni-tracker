from apscheduler.schedulers.background import BackgroundScheduler
import datetime
from sqlalchemy.orm import Session
import models
from database import SessionLocal
from services import tracking_logic

scheduler = BackgroundScheduler()

def run_tracking_job():
    print("Running background tracking job...")
    db: Session = SessionLocal()
    try:
        six_months_ago = datetime.datetime.now() - datetime.timedelta(days=180)
        
        alumni_to_track = db.query(models.Alumni).filter(
            models.Alumni.opt_out == False,
            (models.Alumni.status == "Belum Dilacak") | 
            (models.Alumni.status == "Perlu Verifikasi Manual") | 
            (models.Alumni.last_updated < six_months_ago)
        ).limit(50).all()
        
        for alumni in alumni_to_track:
             print(f"Tracking alumni: {alumni.name}")
             tracking_logic.track_alumni(alumni.id)
             
    except Exception as e:
        print(f"Scheduler Error: {e}")
    finally:
        db.close()

def start_scheduler():
    scheduler.add_job(run_tracking_job, 'interval', days=7, id='weekly_tracking_job', replace_existing=True)
    scheduler.start()

def shutdown_scheduler():
    scheduler.shutdown()
