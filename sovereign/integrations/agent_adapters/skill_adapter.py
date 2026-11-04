"""SOVEREIGN AI Agent Skill Adapter: Exposes SOVEREIGN capabilities as AI agent skills/tools."""

from typing import Any, Dict, List, Optional
from sovereign.core import AcceptanceCriterion, ExecutionContext, Objective, Subtask, ToolContract
from sovereign.decision_engine import DecisionEngine
from sovereign.pattern_analysis import PatternAnalysisEngine
from sovereign.polymath import PolymathEngine
from sovereign.repair import RecursiveRepairEngine


class SovereignSkillAdapter:
    """Skill adapter exposing SOVEREIGN core capabilities as standardized tool contracts for AI agents."""

    def __init__(
        self,
        polymath_engine: Optional[PolymathEngine] = None,
        decision_engine: Optional[DecisionEngine] = None,
        pattern_engine: Optional[PatternAnalysisEngine] = None,
        repair_engine: Optional[RecursiveRepairEngine] = None
    ):
        self.polymath = polymath_engine or PolymathEngine()
        self.decision = decision_engine or DecisionEngine()
        self.pattern = pattern_engine or PatternAnalysisEngine()
        self.repair = repair_engine or RecursiveRepairEngine()

    def get_skill_manifests(self) -> List[Dict[str, Any]]:
        """Return JSON-schema compatible skill/tool manifests for agent runtimes."""
        return [
            {
                "name": "sovereign_select_expertise",
                "description": "Select relevant professional disciplines and research principles for a subtask.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "subtask_description": {"type": "string"}
                    },
                    "required": ["subtask_description"]
                }
            },
            {
                "name": "sovereign_evaluate_decision",
                "description": "Evaluate a structured JEV decision contract (CHOICE, SCORE, or NOUL).",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "question_type": {"type": "string", "enum": ["CHOICE", "SCORE", "NOUL"]},
                        "question_text": {"type": "string"},
                        "allowed_choices": {"type": "array", "items": {"type": "string"}},
                        "context": {"type": "object"}
                    },
                    "required": ["question_type", "question_text"]
                }
            },
            {
                "name": "sovereign_discover_patterns",
                "description": "Analyze ingested execution logs and discover candidate recurring patterns.",
                "parameters": {
                    "type": "object",
                    "properties": {},
                    "required": []
                }
            }
        ]

    def create_tool_contracts(self) -> List[ToolContract]:
        """Convert skill manifests into executable SOVEREIGN ToolContracts."""
        def handle_expertise(subtask_description: str) -> Dict[str, Any]:
            disciplines = self.polymath.select_expertise(subtask_description)
            principles = [p.name for p in self.polymath.research_principles(disciplines)]
            return {"disciplines": disciplines, "applicable_principles": principles}

        def handle_decision(question_type: str, question_text: str, allowed_choices: Optional[List[str]] = None, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
            ctx = context or {}
            if question_type == "CHOICE":
                res = self.decision.evaluate_choice(question_text, allowed_choices or ["OTHER"], ctx)
            elif question_type == "SCORE":
                res = self.decision.evaluate_score(question_text, 0.0, 5.0, {}, ctx)
            else:
                res = self.decision.evaluate_noul(question_text, [], ctx)
            return {
                "judgment": res.judgment_value,
                "confidence": res.confidence,
                "valid": res.valid,
                "provider": res.provider
            }

        def handle_patterns() -> Dict[str, Any]:
            patterns = self.pattern.discover_patterns()
            return {
                "discovered_patterns_count": len(patterns),
                "patterns": [{"id": p.pattern_id, "name": p.pattern_name, "occurrences": p.occurrence_count} for p in patterns]
            }

        return [
            ToolContract(
                name="sovereign_select_expertise",
                description="Select relevant professional disciplines and research principles for a subtask.",
                input_schema={"required": ["subtask_description"]},
                output_schema={"required": ["disciplines", "applicable_principles"]},
                handler=handle_expertise
            ),
            ToolContract(
                name="sovereign_evaluate_decision",
                description="Evaluate a structured JEV decision contract.",
                input_schema={"required": ["question_type", "question_text"]},
                output_schema={"required": ["judgment", "valid"]},
                handler=handle_decision
            ),
            ToolContract(
                name="sovereign_discover_patterns",
                description="Discover candidate recurring patterns.",
                input_schema={},
                output_schema={"required": ["discovered_patterns_count"]},
                handler=handle_patterns
            )
        ]

    def register_skills_with_context(self, context: ExecutionContext) -> None:
        """Register skill tool contracts directly with an ExecutionContext."""
        for contract in self.create_tool_contracts():
            context.register_tool(contract)
