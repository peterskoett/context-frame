export type AgentMode = 'default' | 'improve';
export declare function runAgentFlow(targetPath: string, mode?: AgentMode): Promise<void>;
