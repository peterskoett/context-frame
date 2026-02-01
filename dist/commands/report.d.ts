export type ReportFormat = 'json' | 'markdown' | 'terminal' | 'csv';
export declare function reportCommand(targetPath: string, format: ReportFormat): Promise<void>;
