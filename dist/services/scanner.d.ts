import { FilePattern } from '../models/patterns';
export interface DetectedFile {
    path: string;
    pattern: FilePattern;
    exists: boolean;
    size?: number;
    wordCount?: number;
}
export interface ScanResult {
    basePath: string;
    detectedFiles: DetectedFile[];
    toolsDetected: string[];
    totalFilesScanned: number;
}
export declare function scanRepository(basePath: string): Promise<ScanResult>;
export declare function analyzeFileContent(filePath: string): {
    sections: number;
    filePaths: number;
    commands: number;
    constraints: number;
    wordCount: number;
};
