from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ResultBase(BaseModel):
    source: str
    profile_url: str
    extracted_name: str
    extracted_affiliation: str
    confidence_score: float
    status: str

class ResultCreate(ResultBase):
    pass

class Result(ResultBase):
    id: int
    alumni_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class AlumniBase(BaseModel):
    name: str
    nama_kampus: Optional[str] = None
    singkatan_kampus: Optional[str] = None
    program: Optional[str] = None
    fakultas: Optional[str] = None
    year_in: Optional[int] = None
    year_out: Optional[int] = None
    kota_asal: Optional[str] = None
    variasi_nama: Optional[str] = None
    opt_out: bool = False

class AlumniCreate(AlumniBase):
    pass

class AlumniUpdateBase(BaseModel):
    pass

class AlumniUpdate(AlumniUpdateBase):
    opt_out: Optional[bool] = None

class Alumni(AlumniBase):
    id: int
    status: str
    last_updated: Optional[datetime] = None
    results: List[Result] = []

    class Config:
        from_attributes = True
