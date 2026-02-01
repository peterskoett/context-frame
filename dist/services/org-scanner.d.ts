import { DetectedFile } from './scanner';
export interface OrgRepoScan {
    name: string;
    detectedFiles: DetectedFile[];
}
export interface OrgScanResult {
    org: string;
    repos: OrgRepoScan[];
}
export declare function scanOrg(org: string): Promise<OrgScanResult>;
