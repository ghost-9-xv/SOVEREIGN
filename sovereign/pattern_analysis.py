"""Pattern analysis engine: observation ingestion, candidate discovery, classification, evidence evaluation, and trend analysis."""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Set
import time


class PatternCategory(Enum):
    PERFORMANCE = "PERFORMANCE"
    USABILITY = "USABILITY"
    ENGINEERING = "ENGINEERING"
    SECURITY = "SECURITY"
    WORKFLOW = "WORKFLOW"
    BEHAVIORAL = "BEHAVIORAL"
    RESEARCH = "RESEARCH"
    OTHER = "OTHER"


class PatternStatus(Enum):
    HYPOTHESIS = "HYPOTHESIS"
    UNDER_INVESTIGATION = "UNDER_INVESTIGATION"
    VALIDATED = "VALIDATED"
    REJECTED = "REJECTED"
    OBSOLETE = "OBSOLETE"


@dataclass
class ObservationRecord:
    observation_id: str
    source: str
    event_type: str
    details: Dict[str, Any]
    timestamp: float = field(default_factory=time.time)


@dataclass
class PatternRecord:
    pattern_id: str
    pattern_name: str
    category: PatternCategory
    observations: List[str]
    occurrence_count: int
    first_observed: float
    last_observed: float
    affected_components: List[str]
    supporting_evidence: List[str] = field(default_factory=list)
    contradictory_evidence: List[str] = field(default_factory=list)
    candidate_explanations: List[str] = field(default_factory=list)
    status: PatternStatus = PatternStatus.HYPOTHESIS
    severity: float = 1.0


class PatternAnalysisEngine:
    def __init__(self):
        self.observations: List[ObservationRecord] = []
        self.patterns: Dict[str, PatternRecord] = {}

    def ingest_observation(self, source: str, event_type: str, details: Dict[str, Any]) -> ObservationRecord:
        obs_id = f"obs_{len(self.observations) + 1}"
        obs = ObservationRecord(observation_id=obs_id, source=source, event_type=event_type, details=details)
        self.observations.append(obs)
        return obs

    def discover_patterns(self) -> List[PatternRecord]:
        """Deterministic candidate pattern discovery based on event frequencies and signatures."""
        counts: Dict[str, List[ObservationRecord]] = {}
        for obs in self.observations:
            key = f"{obs.event_type}:{obs.details.get('error_code', 'general')}"
            counts.setdefault(key, []).append(obs)

        discovered = []
        for key, obs_list in counts.items():
            if len(obs_list) >= 2:  # Candidate pattern if recurring
                pattern_id = f"pattern_{key.replace(':', '_')}"
                existing = self.patterns.get(pattern_id)
                if not existing:
                    record = PatternRecord(
                        pattern_id=pattern_id,
                        pattern_name=f"Recurring pattern: {key}",
                        category=PatternCategory.ENGINEERING,
                        observations=[o.observation_id for o in obs_list],
                        occurrence_count=len(obs_list),
                        first_observed=obs_list[0].timestamp,
                        last_observed=obs_list[-1].timestamp,
                        affected_components=[o.source for o in obs_list],
                        supporting_evidence=[f"Observed {len(obs_list)} times in logs."],
                        candidate_explanations=[f"Systematic failure in {key}"]
                    )
                    self.patterns[pattern_id] = record
                    discovered.append(record)
                else:
                    existing.occurrence_count = len(obs_list)
                    existing.observations = [o.observation_id for o in obs_list]
                    existing.last_observed = obs_list[-1].timestamp
                    discovered.append(existing)

        return discovered

    def add_counterevidence(self, pattern_id: str, counterevidence_text: str) -> bool:
        """Preserve evidence challenging a candidate pattern."""
        pattern = self.patterns.get(pattern_id)
        if pattern:
            pattern.contradictory_evidence.append(counterevidence_text)
            if len(pattern.contradictory_evidence) >= len(pattern.supporting_evidence):
                pattern.status = PatternStatus.REJECTED
            return True
        return False

    def validate_pattern(self, pattern_id: str) -> bool:
        pattern = self.patterns.get(pattern_id)
        if pattern and pattern.occurrence_count >= 2 and not pattern.contradictory_evidence:
            pattern.status = PatternStatus.VALIDATED
            return True
        return False

    def calculate_trend(self, event_type: str, window_seconds: float = 3600.0) -> Dict[str, Any]:
        """Longitudinal trend analysis using deterministic calculations over specified measurement window."""
        now = time.time()
        window_start = now - window_seconds
        relevant_obs = [o for o in self.observations if o.event_type == event_type and o.timestamp >= window_start]
        return {
            "event_type": event_type,
            "window_seconds": window_seconds,
            "count": len(relevant_obs),
            "rate_per_minute": (len(relevant_obs) / (window_seconds / 60.0))
        }
