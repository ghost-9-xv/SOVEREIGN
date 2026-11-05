"""JEV-inspired structured decision engine: CHOICE, SCORE, and NOUL judgments with provider adapters."""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Union


class QuestionType(Enum):
    CHOICE = "CHOICE"
    SCORE = "SCORE"
    NOUL = "NOUL"


@dataclass
class ChoiceQuestion:
    question_text: str
    allowed_choices: List[str]
    fallback_choice: str = "OTHER"


@dataclass
class RubricScoreQuestion:
    question_text: str
    min_score: float = 0.0
    max_score: float = 5.0
    rubric_description: Dict[int, str] = field(default_factory=dict)


@dataclass
class NoulQuestion:
    proposition: str
    evidence_references: List[str] = field(default_factory=list)


@dataclass
class StructuredDecisionContract:
    question_type: QuestionType
    question_data: Union[ChoiceQuestion, RubricScoreQuestion, NoulQuestion]
    context: Dict[str, Any]
    policy_threshold: Optional[float] = None


@dataclass
class DecisionResult:
    question_type: QuestionType
    judgment_value: Any
    confidence: float
    evidence_references: List[str]
    provider: str
    raw_response: Dict[str, Any]
    valid: bool = True
    error_message: Optional[str] = None


class BaseDecisionProvider:
    """Provider interface for decision engines."""
    def evaluate(self, contract: StructuredDecisionContract) -> DecisionResult:
        raise NotImplementedError


class DeterministicMockProvider(BaseDecisionProvider):
    """Deterministic mock provider for testing and offline fallbacks."""
    def __init__(self, mocked_responses: Optional[Dict[str, Any]] = None):
        self.mocked_responses = mocked_responses or {}

    def evaluate(self, contract: StructuredDecisionContract) -> DecisionResult:
        if contract.question_type == QuestionType.CHOICE:
            q: ChoiceQuestion = contract.question_data  # type: ignore
            choice = self.mocked_responses.get("choice", q.allowed_choices[0] if q.allowed_choices else q.fallback_choice)
            if choice not in q.allowed_choices:
                choice = q.fallback_choice
            return DecisionResult(
                question_type=QuestionType.CHOICE,
                judgment_value=choice,
                confidence=0.95,
                evidence_references=contract.context.get("evidence_keys", []),
                provider="DeterministicMockProvider",
                raw_response={"choice": choice},
                valid=True
            )

        elif contract.question_type == QuestionType.SCORE:
            q_score: RubricScoreQuestion = contract.question_data  # type: ignore
            raw_val = self.mocked_responses.get("score", q_score.max_score)
            try:
                score = float(raw_val)
            except (ValueError, TypeError):
                return DecisionResult(
                    question_type=QuestionType.SCORE,
                    judgment_value=q_score.min_score,
                    confidence=0.0,
                    evidence_references=[],
                    provider="DeterministicMockProvider",
                    raw_response={"score": raw_val},
                    valid=False,
                    error_message=f"Score '{raw_val}' is invalid format"
                )

            if score < q_score.min_score or score > q_score.max_score:
                return DecisionResult(
                    question_type=QuestionType.SCORE,
                    judgment_value=q_score.min_score,
                    confidence=0.0,
                    evidence_references=[],
                    provider="DeterministicMockProvider",
                    raw_response={"score": score},
                    valid=False,
                    error_message=f"Score {score} out of bounds [{q_score.min_score}, {q_score.max_score}]"
                )
            return DecisionResult(
                question_type=QuestionType.SCORE,
                judgment_value=score,
                confidence=0.9,
                evidence_references=contract.context.get("evidence_keys", []),
                provider="DeterministicMockProvider",
                raw_response={"score": score},
                valid=True
            )

        elif contract.question_type == QuestionType.NOUL:
            truth = bool(self.mocked_responses.get("truth", True))
            return DecisionResult(
                question_type=QuestionType.NOUL,
                judgment_value=truth,
                confidence=0.92,
                evidence_references=contract.context.get("evidence_keys", []),
                provider="DeterministicMockProvider",
                raw_response={"truth": truth},
                valid=True
            )

        return DecisionResult(
            question_type=contract.question_type,
            judgment_value=None,
            confidence=0.0,
            evidence_references=[],
            provider="DeterministicMockProvider",
            raw_response={},
            valid=False,
            error_message="Unsupported question type"
        )


class DecisionEngine:
    """Decision engine managing structured contracts, schema validation, and fallback handling."""
    def __init__(self, provider: Optional[BaseDecisionProvider] = None):
        self.provider = provider or DeterministicMockProvider()

    def evaluate_choice(self, question_text: str, allowed_choices: List[str], context: Dict[str, Any], fallback: str = "OTHER") -> DecisionResult:
        q = ChoiceQuestion(question_text=question_text, allowed_choices=allowed_choices, fallback_choice=fallback)
        contract = StructuredDecisionContract(question_type=QuestionType.CHOICE, question_data=q, context=context)
        res = self.provider.evaluate(contract)
        # Schema validation
        if res.judgment_value not in allowed_choices and res.judgment_value != fallback:
            res.judgment_value = fallback
            res.error_message = "Choice invalid; reverted to fallback."
        return res

    def evaluate_score(self, question_text: str, min_score: float, max_score: float, rubric: Dict[int, str], context: Dict[str, Any]) -> DecisionResult:
        q = RubricScoreQuestion(question_text=question_text, min_score=min_score, max_score=max_score, rubric_description=rubric)
        contract = StructuredDecisionContract(question_type=QuestionType.SCORE, question_data=q, context=context)
        res = self.provider.evaluate(contract)
        if not res.valid or not isinstance(res.judgment_value, (int, float)):
            res.valid = False
            res.error_message = res.error_message or "Score evaluation produced invalid format."
        elif res.judgment_value < min_score or res.judgment_value > max_score:
            res.valid = False
            res.error_message = f"Score {res.judgment_value} out of range."
        return res

    def evaluate_noul(self, proposition: str, evidence_refs: List[str], context: Dict[str, Any]) -> DecisionResult:
        q = NoulQuestion(proposition=proposition, evidence_references=evidence_refs)
        contract = StructuredDecisionContract(question_type=QuestionType.NOUL, question_data=q, context=context)
        return self.provider.evaluate(contract)
