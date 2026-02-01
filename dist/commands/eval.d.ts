export type EvalFormat = 'json' | 'markdown';
export declare function evalCommand(configPath: string, targetPath: string, format?: EvalFormat): Promise<void>;
