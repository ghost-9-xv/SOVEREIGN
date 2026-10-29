"""Categorized persistent memory system with provenance, confidence, and validation tracking."""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional
import time


class MemoryCategory(Enum):
    SEMANTIC = "SEMANTIC"
    EPISODIC = "EPISODIC"
    PROCEDURAL = "PROCEDURAL"
    DECISION = "DECISION"
    EXPERIMENTAL = "EXPERIMENTAL"
    PREFERENCE = "PREFERENCE"
    PROJECT = "PROJECT"
    EXPERTISE = "EXPERTISE"
    PATTERNS = "PATTERNS"


@dataclass
class MemoryRecord:
    memory_id: str
    category: MemoryCategory
    content: Any
    source: str
    timestamp: float = field(default_factory=time.time)
    scope: str = "global"
    confidence: float = 1.0
    validated: bool = True
    supporting_evidence: List[str] = field(default_factory=list)


class MemoryStore:
    def __init__(self):
        self.records: Dict[str, MemoryRecord] = {}

    def store(
        self,
        category: MemoryCategory,
        content: Any,
        source: str,
        scope: str = "global",
        confidence: float = 1.0,
        evidence: Optional[List[str]] = None
    ) -> MemoryRecord:
        mem_id = f"mem_{len(self.records) + 1}"
        record = MemoryRecord(
            memory_id=mem_id,
            category=category,
            content=content,
            source=source,
            scope=scope,
            confidence=confidence,
            validated=True,
            supporting_evidence=evidence or []
        )
        self.records[mem_id] = record
        return record

    def retrieve(self, category: Optional[MemoryCategory] = None, scope: Optional[str] = None) -> List[MemoryRecord]:
        results = []
        for record in self.records.values():
            if category and record.category != category:
                continue
            if scope and record.scope != scope:
                continue
            results.append(record)
        return results

    def delete(self, memory_id: str) -> bool:
        if memory_id in self.records:
            del self.records[memory_id]
            return True
        return False
