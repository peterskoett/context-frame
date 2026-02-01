export type ScanFormat = 'terminal' | 'json' | 'markdown' | 'csv' | 'sarif';
export declare function scanCommand(targetPath: string, format?: ScanFormat, watch?: boolean): Promise<void>;
