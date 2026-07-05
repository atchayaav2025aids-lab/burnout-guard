from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(String, default=lambda: datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

    datasets = relationship("Dataset", back_populates="user", cascade="all, delete-orphan")
    analyses = relationship("AnalysisHistory", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="user", cascade="all, delete-orphan")

class Dataset(Base):
    __tablename__ = "datasets"
    
    id = Column(String, primary_key=True, index=True) # UUID
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    row_count = Column(Integer, nullable=False)
    col_count = Column(Integer, nullable=False)
    uploaded_at = Column(String, default=lambda: datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    filepath = Column(String, nullable=False)
    columns_json = Column(Text, nullable=False) # JSON encoded data types and names
    missing_count = Column(Integer, default=0)
    duplicate_count = Column(Integer, default=0)

    user = relationship("User", back_populates="datasets")

class AnalysisHistory(Base):
    __tablename__ = "analysis_history"
    
    id = Column(String, primary_key=True, index=True) # UUID matching dataset id
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    dataset_name = Column(String, nullable=False)
    upload_date = Column(String, nullable=False)
    accuracy = Column(String, nullable=False) # e.g. "93.0%" or "Rule-Based"
    total_employees = Column(Integer, nullable=False)
    risk_summary_json = Column(Text, nullable=False) # e.g. low, moderate, high counts
    results_json = Column(Text, nullable=False) # JSON string of all developer predictions

    user = relationship("User", back_populates="analyses")
    reports = relationship("Report", back_populates="analysis", cascade="all, delete-orphan")

class Report(Base):
    __tablename__ = "reports"
    
    id = Column(String, primary_key=True, index=True) # UUID
    analysis_id = Column(String, ForeignKey("analysis_history.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    created_at = Column(String, default=lambda: datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    summary_json = Column(Text, nullable=False) # Report details cache

    user = relationship("User", back_populates="reports")
    analysis = relationship("AnalysisHistory", back_populates="reports")
