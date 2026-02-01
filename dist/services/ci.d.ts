export declare function runCi(targetPath: string): Promise<{
    exitCode: number;
    report: Record<string, unknown>;
}>;
export declare function initCiWorkflow(basePath: string): string;
