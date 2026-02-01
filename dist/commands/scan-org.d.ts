export type OrgReportFormat = 'terminal' | 'json' | 'markdown' | 'csv';
export declare function scanOrgCommand(org: string, format?: OrgReportFormat): Promise<void>;
