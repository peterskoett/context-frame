import type { CopilotClient } from '@github/copilot-sdk';
export interface CopilotClientConfig {
    workspacePath: string;
    cliPath?: string;
    cliUrl?: string;
    logLevel?: 'none' | 'error' | 'warning' | 'info' | 'debug' | 'all';
}
export declare class CopilotClientManager {
    private client?;
    private readonly config;
    constructor(config: CopilotClientConfig);
    start(): Promise<CopilotClient>;
    stop(): Promise<void>;
}
