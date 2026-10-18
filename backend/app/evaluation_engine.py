"""Evaluation engines: an optional AI judge and a dependable local fallback."""

import json
import re
from abc import ABC, abstractmethod
from typing import Any

import httpx

from .config import Settings
from .schemas import CRITERIA, CandidateResult, CriterionScore, EvaluationRequest, EvaluationResult


def _clamp(value: int) -> int:
    return max(1, min(10, value))


class Judge(ABC):
    @abstractmethod
    async def evaluate(self, request: EvaluationRequest) -> EvaluationResult:
        raise NotImplementedError


class LocalRubricJudge(Judge):
    """Transparent heuristic rubric for demos, tests, and offline development."""

    def _score_candidate(self, text: str, prompt: str) -> CandidateResult:
        lowered = text.lower()
        prompt_terms = {term for term in re.findall(r"[a-zA-Z]{5,}", prompt.lower())}
        matching_terms = sum(term in lowered for term in prompt_terms)
        has_code = "```" in text or bool(
            re.search(r"\b(def|function|class|const|let|import)\b", text)
        )
        has_structure = bool(re.search(r"\n\s*(?:[-*]|\d+\.|def |function )", text))
        has_explanation = bool(
            re.search(r"\b(because|therefore|for example|this means|note that)\b", lowered)
        )
        is_brief = len(text.split()) < 15
        risky = bool(
            re.search(
                r"rm\s+-rf|eval\(|exec\(|disable.*security|bypass.*auth|ignore.*safety", lowered
            )
        )

        correctness = _clamp(
            5 + min(3, matching_terms // 2) + (1 if has_code else 0) - (2 if is_brief else 0)
        )
        code_quality = _clamp(
            5
            + (2 if has_code else 0)
            + (1 if has_structure else 0)
            + (1 if "try" in lowered or "error" in lowered else 0)
            - (1 if len(text) > 5000 else 0)
        )
        efficiency = _clamp(
            6
            + (
                1
                if re.search(r"o\([n1]|linear|constant|cache|generator|dictionary|set", lowered)
                else 0
            )
            - (1 if re.search(r"nested loop|brute force|for.*for", lowered) else 0)
        )
        helpfulness = _clamp(
            4
            + min(3, len(text.split()) // 35)
            + (1 if has_explanation else 0)
            + (1 if has_structure else 0)
            - (2 if is_brief else 0)
        )
        safety = _clamp(
            9
            - (6 if risky else 0)
            - (1 if "password" in lowered and "environment" not in lowered else 0)
        )

        scores = {
            "correctness": CriterionScore(
                score=correctness,
                explanation="Addresses the task with relevant details and concrete implementation signals.",
            ),
            "code_quality": CriterionScore(
                score=code_quality,
                explanation="Assessed for readable structure, maintainability, and defensive implementation cues.",
            ),
            "efficiency": CriterionScore(
                score=efficiency,
                explanation="Assessed for awareness of algorithmic cost and avoiding unnecessary work.",
            ),
            "helpfulness": CriterionScore(
                score=helpfulness,
                explanation="Assessed for explanation, context, and actionable guidance beyond a bare answer.",
            ),
            "safety": CriterionScore(
                score=safety,
                explanation=(
                    "Potentially unsafe execution or security-bypass language was detected."
                    if risky
                    else "No clear unsafe execution or security-bypass instruction was detected."
                ),
            ),
        }
        average = round(sum(item.score for item in scores.values()) / len(CRITERIA), 1)
        return CandidateResult(
            scores=scores,
            average=average,
            summary=(
                f"A {'structured' if has_structure else 'concise'} response with an overall {average}/10 local-rubric score."
            ),
        )

    async def evaluate(self, request: EvaluationRequest) -> EvaluationResult:
        candidate_a = self._score_candidate(request.response_a, request.prompt)
        candidate_b = self._score_candidate(request.response_b, request.prompt)
        difference = candidate_a.average - candidate_b.average
        if abs(difference) <= 0.25:
            winner = "tie"
            rationale = "The candidates are effectively tied across the weighted rubric; review criterion notes for trade-offs."
        elif difference > 0:
            winner = "A"
            rationale = "Response A has the stronger combined rubric score, particularly on task coverage and presentation."
        else:
            winner = "B"
            rationale = "Response B has the stronger combined rubric score, particularly on task coverage and presentation."
        confidence = min(95, 55 + int(abs(difference) * 18))
        return EvaluationResult(
            candidate_a=candidate_a,
            candidate_b=candidate_b,
            winner=winner,
            rationale=rationale,
            confidence=confidence,
            engine="local-rubric",
        )


class OpenAICompatibleJudge(Judge):
    """Calls any OpenAI-compatible chat-completions endpoint and validates its result."""

    def __init__(self, settings: Settings):
        self.settings = settings

    async def evaluate(self, request: EvaluationRequest) -> EvaluationResult:
        rubric = ", ".join(CRITERIA)
        system = (
            "You are EvalForge, a rigorous AI response evaluator. Evaluate two answers to the same prompt. "
            f"Score each criterion ({rubric}) from 1 to 10. Be fair, concise, and prioritize safety. "
            "Return ONLY valid JSON with candidate_a and candidate_b (each with scores keyed by each criterion, "
            "average, and summary), winner (A, B, or tie), rationale, and confidence (0-100). "
            "Each score must contain score and explanation."
        )
        user = (
            f"PROMPT:\n{request.prompt}\n\nRESPONSE A:\n{request.response_a}"
            f"\n\nRESPONSE B:\n{request.response_b}"
        )
        url = f"{self.settings.openai_base_url.rstrip('/')}/chat/completions"
        payload: dict[str, Any] = {
            "model": self.settings.openai_model,
            "temperature": 0.1,
            "response_format": {"type": "json_object"},
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
        }
        headers = {"Authorization": f"Bearer {self.settings.openai_api_key}"}
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        parsed = json.loads(content)
        parsed["engine"] = "openai-compatible"
        return EvaluationResult.model_validate(parsed)


class EvaluationService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.local_judge = LocalRubricJudge()

    async def evaluate(self, request: EvaluationRequest) -> EvaluationResult:
        if not self.settings.openai_api_key:
            return await self.local_judge.evaluate(request)
        try:
            return await OpenAICompatibleJudge(self.settings).evaluate(request)
        except (httpx.HTTPError, KeyError, TypeError, ValueError, json.JSONDecodeError):
            fallback = await self.local_judge.evaluate(request)
            return fallback.model_copy(update={"engine": "local-rubric (AI judge unavailable)"})
