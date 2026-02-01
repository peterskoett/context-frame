export type TemplateName = 'react' | 'node' | 'python' | 'go' | 'rust';
export declare function generateTemplate(template: TemplateName, basePath: string): string[];
