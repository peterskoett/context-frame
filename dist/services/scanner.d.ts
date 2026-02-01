import { FilePattern } from '../models/patterns';
export interface DetectedFile {
    path: string;
    pattern: FilePattern;
    exists: boolean;
    size?: number;
    wordCount?: number;
    metrics?: {
        sections: number;
        filePaths: number;
        commands: number;
        constraints: number;
        wordCount: number;
    };
}
export interface ReferenceIssue {
    sourceFile: string;
    reference: string;
    resolvedPath: string;
}
export interface ReferenceValidationResult {
    totalReferences: number;
    resolvedReferences: number;
    resolutionRate: number;
    brokenReferences: ReferenceIssue[];
}
export interface ScanResult {
    basePath: string;
    detectedFiles: DetectedFile[];
    toolsDetected: string[];
    totalFilesScanned: number;
    referenceValidation: ReferenceValidationResult;
    commitCounts: Record<string, number>;
}
export declare function scanRepository(basePath: string): Promise<ScanResult>;
export declare function analyzeFileContent(filePath: string): {
    sections: number;
    filePaths: number;
    commands: number;
    constraints: number;
    wordCount: number;
};
export declare function analyzeTextContent(content: string): {
    sections: number;
    filePaths: number;
    commands: number;
    constraints: number;
    wordCount: number;
};
