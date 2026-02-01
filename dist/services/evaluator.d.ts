export interface EvalPrompt {
    id?: string;
    prompt: string;
}
export interface EvalConfig {
    prompts: EvalPrompt[];
    contextFiles?: string[];
    model?: string;
    judgeModel?: string;
    rubric?: string;
}
export interface EvalResult {
    promptId: string;
    prompt: string;
    withoutContext: string;
    withContext: string;
    judge: {
        scoreWithout: number;
        scoreWith: number;
        verdict: string;
    };
}
export declare function runEvaluation(configPath: string, basePath: string): Promise<EvalResult[]>;
