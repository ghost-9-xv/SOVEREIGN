"""Adaptive polymathic expertise selection, principle research, and expertise specification cards."""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class Principle:
    name: str
    category: str
    description: str
    source_reference: str
    validated: bool = True


@dataclass
class ExpertiseCard:
    subtask_id: str
    disciplines: List[str]
    applicable_principles: List[Principle]
    supporting_evidence: List[str]
    constraints: List[str]
    expected_failures: List[str]
    chosen_approach: str
    acceptance_criteria: List[str]
    verification_method: str
    stopping_condition: str


class PolymathEngine:
    def __init__(self):
        self.principle_registry: Dict[str, Principle] = {}
        self._initialize_default_principles()

    def _initialize_default_principles(self):
        defaults = [
            Principle("YAGNI", "Software Engineering", "You Aren't Gonna Need It: Avoid speculative features.", "Fowler et al."),
            Principle("KISS", "Software Engineering", "Keep It Simple, Stupid: Prefer simple architectures.", "Kelly Johnson"),
            Principle("DRY", "Software Engineering", "Don't Repeat Yourself, applied without premature abstraction.", "Hunt & Thomas"),
            Principle("Least Privilege", "Security Engineering", "Grant minimum necessary permissions for subtasks.", "NIST SP 800-53"),
            Principle("Defense in Depth", "Security Engineering", "Layer multiple security controls.", "NSA Security Design"),
            Principle("Root Cause Diagnosis", "Debugging", "Reproduce, form hypothesis, test, fix, and verify.", "IEEE Debugging Guide"),
        ]
        for p in defaults:
            self.principle_registry[p.name] = p

    def select_expertise(self, subtask_description: str, task_category: Optional[str] = None) -> List[str]:
        """Select appropriate professional disciplines based on task attributes."""
        desc_lower = subtask_description.lower()
        disciplines = []
        if any(word in desc_lower for word in ["auth", "security", "token", "password", "permission"]):
            disciplines.extend(["Security Engineering", "Identity Management"])
        if any(word in desc_lower for word in ["test", "verify", "assert", "check"]):
            disciplines.extend(["Test Engineering", "Quality Assurance"])
        if any(word in desc_lower for word in ["perf", "optimize", "profile", "speed", "latency"]):
            disciplines.extend(["Performance Engineering", "Systems Engineering"])
        if any(word in desc_lower for word in ["fix", "bug", "repair", "defect", "error"]):
            disciplines.extend(["Debugging", "Software Design"])

        if not disciplines:
            disciplines = ["Software Engineering", "Requirements Engineering"]

        return list(dict.fromkeys(disciplines))

    def research_principles(self, disciplines: List[str]) -> List[Principle]:
        """Retrieve principles relevant to chosen disciplines."""
        matched = []
        for p in self.principle_registry.values():
            if p.category in disciplines or p.category == "Software Engineering":
                matched.append(p)
        return matched

    def generate_expertise_card(
        self,
        subtask_id: str,
        description: str,
        acceptance_criteria: List[str],
        verification_method: str
    ) -> ExpertiseCard:
        disciplines = self.select_expertise(description)
        principles = self.research_principles(disciplines)
        return ExpertiseCard(
            subtask_id=subtask_id,
            disciplines=disciplines,
            applicable_principles=principles,
            supporting_evidence=["Task description analysis", "Principle registry lookup"],
            constraints=["Operate within sandbox", "Maintain least privilege"],
            expected_failures=["Regression", "Unhandled edge case"],
            chosen_approach=f"Execute using principles from {', '.join(disciplines)}",
            acceptance_criteria=acceptance_criteria,
            verification_method=verification_method,
            stopping_condition="Acceptance criteria verified or retry budget exhausted"
        )
