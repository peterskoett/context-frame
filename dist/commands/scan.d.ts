export type ScanFormat = 'terminal' | 'json' | 'markdown' | 'csv';
export declare function scanCommand(targetPath: string, format?: ScanFormat): Promise<void>;
