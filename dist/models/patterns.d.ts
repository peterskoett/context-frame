export interface FilePattern {
    name: string;
    tool: string;
    patterns: string[];
    weight: number;
    level: number;
}
export declare const FILE_PATTERNS: FilePattern[];
export declare function getPatternsByTool(tool: string): FilePattern[];
export declare function getPatternsByLevel(level: number): FilePattern[];
