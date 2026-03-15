from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel


class DrugInfo(BaseModel):
    drug_name: str
    generic_name: str
    usage: str
    caution: str
    dosage: str
    matched: bool
    image_url: Optional[str] = None


class AnalysisData(BaseModel):
    image_type: Literal["prescription", "packaged_drug", "unknown"]
    extracted_text: str
    drugs: List[DrugInfo]
    warnings: List[str]


class AnalysisResult(BaseModel):
    status: Literal["success", "error"]
    data: Optional[AnalysisData] = None
    message: Optional[str] = None
