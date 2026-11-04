/**
 * SOVEREIGN Decision Engine
 * JEV-inspired structured judgment system (Part 6)
 */
import { StructuredJudgment, ChoiceJudgment, ScoreJudgment, NoulJudgment, DecisionContract, DecisionPolicy, RubricLevel } from "./types.js";
export interface JudgmentProvider {
    judge(contract: DecisionContract): Promise<StructuredJudgment>;
}
export interface DecisionEngineOptions {
    providers: Map<string, JudgmentProvider>;
    defaultProvider: string;
    policy: DecisionPolicy;
}
export declare class DecisionEngine {
    private options;
    private judgmentHistory;
    constructor(options: DecisionEngineOptions);
    makeChoiceJudgment(context: string, question: string, allowedChoices: string[], evidenceReferences: string[], _rubric?: string): Promise<ChoiceJudgment>;
    makeScoreJudgment(context: string, question: string, rubric: RubricLevel[], evidenceReferences: string[], maxScore?: number): Promise<ScoreJudgment>;
    makeNoulJudgment(context: string, proposition: string, evidenceReferences: string[]): Promise<NoulJudgment>;
    private buildContract;
    private executeJudgment;
    private fallbackJudgment;
    routeDecision(judgment: StructuredJudgment): Promise<"AUTOMATE" | "VERIFY" | "REPAIR" | "ESCALATE" | "BLOCK" | "ABSTAIN">;
    getHistory(): DecisionContract[];
    clearHistory(): void;
}
export declare class DeterministicProvider implements JudgmentProvider {
    judge(contract: DecisionContract): Promise<StructuredJudgment>;
}
export declare function createDefaultDecisionPolicy(): DecisionPolicy;
//# sourceMappingURL=decision-engine.d.ts.map