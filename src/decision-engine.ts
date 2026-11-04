/**
 * SOVEREIGN Decision Engine
 * JEV-inspired structured judgment system (Part 6)
 */

import {
  StructuredJudgment,
  ChoiceJudgment,
  ScoreJudgment,
  NoulJudgment,
  DecisionContract,
  JudgmentType,
  DecisionPolicy,
  RubricLevel
} from "./types.js";

export interface JudgmentProvider {
  judge(contract: DecisionContract): Promise<StructuredJudgment>;
}

export interface DecisionEngineOptions {
  providers: Map<string, JudgmentProvider>;
  defaultProvider: string;
  policy: DecisionPolicy;
}

export class DecisionEngine {
  private options: DecisionEngineOptions;
  private judgmentHistory: DecisionContract[] = [];

  constructor(options: DecisionEngineOptions) {
    this.options = options;
  }

  async makeChoiceJudgment(
    context: string,
    question: string,
    allowedChoices: string[],
    evidenceReferences: string[],
    _rubric?: string
  ): Promise<ChoiceJudgment> {
    const contract = this.buildContract(
      context,
      question,
      "CHOICE",
      { allowedChoices },
      evidenceReferences
    );

    const judgment = await this.executeJudgment(contract);
    this.judgmentHistory.push(contract);

    return judgment as ChoiceJudgment;
  }

  async makeScoreJudgment(
    context: string,
    question: string,
    rubric: RubricLevel[],
    evidenceReferences: string[],
    maxScore: number = 5
  ): Promise<ScoreJudgment> {
    const contract = this.buildContract(
      context,
      question,
      "SCORE",
      { rubric, maxScore },
      evidenceReferences
    );

    const judgment = await this.executeJudgment(contract);
    this.judgmentHistory.push(contract);

    return judgment as ScoreJudgment;
  }

  async makeNoulJudgment(
    context: string,
    proposition: string,
    evidenceReferences: string[]
  ): Promise<NoulJudgment> {
    const contract = this.buildContract(
      context,
      proposition,
      "NOUL",
      { proposition },
      evidenceReferences
    );

    const judgment = await this.executeJudgment(contract);
    this.judgmentHistory.push(contract);

    return judgment as NoulJudgment;
  }

  private buildContract(
    context: string,
    question: string,
    questionType: JudgmentType,
    allowedOutputs: Record<string, unknown>,
    evidenceReferences: string[]
  ): DecisionContract {
    return {
      context,
      question,
      questionType,
      allowedOutputs,
      rubric: allowedOutputs.rubric as RubricLevel[] | undefined,
      evidenceReferences,
      modelResult: null as any,
      provider: this.options.defaultProvider,
      modelVersion: "unknown",
      calibrationStatus: "UNCALIBRATED",
      policy: this.options.policy,
      finalDecision: "",
      verification: []
    };
  }

  private async executeJudgment(contract: DecisionContract): Promise<StructuredJudgment> {
    const provider = this.options.providers.get(this.options.defaultProvider);
    if (!provider) {
      throw new Error(`Provider not found: ${this.options.defaultProvider}`);
    }

    try {
      const judgment = await provider.judge(contract);
      contract.modelResult = judgment;
      contract.modelVersion = "current";
      return judgment;
    } catch (error) {
      return this.fallbackJudgment(contract, error);
    }
  }

  private fallbackJudgment(contract: DecisionContract, error: unknown): StructuredJudgment {
    const errorMsg = error instanceof Error ? error.message : String(error);

    switch (contract.questionType) {
      case "CHOICE": {
        const choices = contract.allowedOutputs.allowedChoices as string[];
        return {
          type: "CHOICE",
          question: contract.question,
          allowedChoices: choices,
          selectedChoice: "NEEDS_REVIEW",
          confidence: 0,
          reasoning: `Provider error: ${errorMsg}. Fallback to NEEDS_REVIEW.`
        };
      }
      case "SCORE": {
        const maxScore = (contract.allowedOutputs.maxScore as number) || 5;
        const rubric = contract.rubric || [];
        return {
          type: "SCORE",
          question: contract.question,
          rubric,
          score: 0,
          maxScore,
          reasoning: `Provider error: ${errorMsg}. Fallback to minimum score.`
        };
      }
      case "NOUL": {
        return {
          type: "NOUL",
          proposition: contract.allowedOutputs.proposition as string,
          supported: "UNCERTAIN",
          confidence: 0,
          evidence: [],
          reasoning: `Provider error: ${errorMsg}. Cannot determine.`
        };
      }
    }
  }

  async routeDecision(judgment: StructuredJudgment): Promise<"AUTOMATE" | "VERIFY" | "REPAIR" | "ESCALATE" | "BLOCK" | "ABSTAIN"> {
    const { policy } = this.options;

    switch (judgment.type) {
      case "CHOICE": {
        for (const rule of policy.escalationRules) {
          if (rule.condition.includes(judgment.selectedChoice)) {
            return rule.action as "AUTOMATE" | "VERIFY" | "REPAIR" | "ESCALATE" | "BLOCK" | "ABSTAIN";
          }
        }

        for (const rule of policy.automationRules) {
          if (rule.condition.includes(judgment.selectedChoice)) {
            return rule.action as "AUTOMATE" | "VERIFY" | "REPAIR" | "ESCALATE" | "BLOCK" | "ABSTAIN";
          }
        }

        return judgment.confidence > 0.8 ? "AUTOMATE" : "VERIFY";
      }

      case "SCORE": {
        const normalizedScore = judgment.score / judgment.maxScore;
        const threshold = policy.thresholds.scoreThreshold || 0.7;

        if (normalizedScore >= threshold && (judgment as any).confidence > 0.7) {
          return "AUTOMATE";
        } else if (normalizedScore >= threshold * 0.7) {
          return "VERIFY";
        } else {
          return "REPAIR";
        }
      }

      case "NOUL": {
        if (judgment.supported === true && judgment.confidence > 0.8) {
          return "AUTOMATE";
        } else if (judgment.supported === "UNCERTAIN" || judgment.confidence < 0.5) {
          return "ABSTAIN";
        } else {
          return "VERIFY";
        }
      }
    }
  }

  getHistory(): DecisionContract[] {
    return [...this.judgmentHistory];
  }

  clearHistory(): void {
    this.judgmentHistory = [];
  }
}

export class DeterministicProvider implements JudgmentProvider {
  async judge(contract: DecisionContract): Promise<StructuredJudgment> {
    switch (contract.questionType) {
      case "CHOICE": {
        const choices = contract.allowedOutputs.allowedChoices as string[];
        const selectedChoice = choices.includes("NEEDS_REVIEW") ? "NEEDS_REVIEW" : choices[0];

        return {
          type: "CHOICE",
          question: contract.question,
          allowedChoices: choices,
          selectedChoice,
          confidence: 0.5,
          reasoning: "Deterministic fallback judgment"
        };
      }

      case "SCORE": {
        const maxScore = (contract.allowedOutputs.maxScore as number) || 5;
        const rubric = contract.rubric || [];
        const evidenceCount = contract.evidenceReferences.length;
        const score = Math.min(maxScore, Math.max(0, evidenceCount));

        return {
          type: "SCORE",
          question: contract.question,
          rubric,
          score,
          maxScore,
          reasoning: `Deterministic score based on ${evidenceCount} evidence references`
        };
      }

      case "NOUL": {
        const proposition = contract.allowedOutputs.proposition as string;
        return {
          type: "NOUL",
          proposition,
          supported: "UNCERTAIN",
          confidence: 0.5,
          evidence: contract.evidenceReferences,
          reasoning: "Deterministic fallback - insufficient evidence for determination"
        };
      }
    }
  }
}

export function createDefaultDecisionPolicy(): DecisionPolicy {
  return {
    thresholds: {
      choiceConfidence: 0.8,
      scoreThreshold: 0.7,
      noulConfidence: 0.8
    },
    escalationRules: [
      { condition: "SECURITY_VIOLATION", action: "ESCALATE" },
      { condition: "RESOURCE_EXHAUSTION", action: "ESCALATE" },
      { condition: "NEEDS_REVIEW", action: "ESCALATE" },
      { condition: "BLOCK", action: "BLOCK" }
    ],
    automationRules: [
      { condition: "SUCCESS", action: "AUTOMATE" },
      { condition: "VERIFIED", action: "AUTOMATE" },
      { condition: "LOW_RISK", action: "AUTOMATE" }
    ]
  };
}
