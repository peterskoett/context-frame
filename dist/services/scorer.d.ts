import { ScanResult } from './scanner';
export interface QualityMetrics {
    sections: number;
    filePaths: number;
    commands: number;
    constraints: number;
    wordCount: number;
}
export interface ScoreResult {
    maturityLevel: number;
    maturityName: string;
    maturityDescription: string;
    qualityScore: number;
    totalWeight: number;
    toolBreakdown: Record<string, {
        files: string[];
        weight: number;
    }>;
    qualityMetrics: QualityMetrics;
    recommendations: string[];
}
export declare function calculateScore(scanResult: ScanResult): ScoreResult;
