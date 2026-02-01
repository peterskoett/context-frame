export interface MaturityLevel {
    level: number;
    name: string;
    description: string;
    requirements: string[];
}
export declare const MATURITY_LEVELS: MaturityLevel[];
export declare function getLevelByNumber(level: number): MaturityLevel | undefined;
