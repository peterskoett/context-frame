export type ReportFormat = 'json' | 'markdown' | 'terminal';
export declare function reportCommand(targetPath: string, format: ReportFormat): Promise<void>;
