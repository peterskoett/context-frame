export interface ContextFrameConfig {
    tools?: string[];
    thresholds?: {
        minLevel?: number;
        minQualityScore?: number;
        minResolvedRefsRate?: number;
    };
    skipPatterns?: string[];
}
export declare function loadConfig(basePath: string): ContextFrameConfig;
