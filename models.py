from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class Alumni(Base):
    __tablename__ = "alumni"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    nama_kampus = Column(String, nullable=True)
    singkatan_kampus = Column(String, nullable=True)
    program = Column(String, nullable=True)
    fakultas = Column(String, nullable=True)
    year_in = Column(Integer, nullable=True)
    year_out = Column(Integer, nullable=True)
    kota_asal = Column(String, nullable=True)
    variasi_nama = Column(String, nullable=True)
    opt_out = Column(Boolean, default=False)
    status = Column(String, default="Belum Dilacak")
    last_updated = Column(DateTime)
    
    results = relationship("TrackingResult", back_populates="alumni")


class TrackingResult(Base):
    __tablename__ = "tracking_results"

    id = Column(Integer, primary_key=True, index=True)
    alumni_id = Column(Integer, ForeignKey("alumni.id"))
    source = Column(String) # LinkedIn, Scholar, GitHub
    profile_url = Column(String)
    extracted_name = Column(String)
    extracted_affiliation = Column(String)
    confidence_score = Column(Float)
    status = Column(String) # Tidak Cocok, Perlu Verifikasi Manual, Kemungkinan Kuat
    created_at = Column(DateTime, server_default=func.now())

    alumni = relationship("Alumni", back_populates="results")
