import type { CopilotClient } from '@github/copilot-sdk';

export interface CopilotClientConfig {
  workspacePath: string;
  cliPath?: string;
  cliUrl?: string;
  logLevel?: 'none' | 'error' | 'warning' | 'info' | 'debug' | 'all';
}

export class CopilotClientManager {
  private client?: CopilotClient;
  private readonly config: CopilotClientConfig;

  constructor(config: CopilotClientConfig) {
    this.config = config;
  }

  async start(): Promise<CopilotClient> {
    if (this.client) {
      return this.client;
    }

    const { CopilotClient: CopilotClientCtor } = await import('@github/copilot-sdk');
    this.client = new CopilotClientCtor({
      cwd: this.config.workspacePath,
      cliPath: this.config.cliPath,
      cliUrl: this.config.cliUrl,
      logLevel: this.config.logLevel ?? 'warning'
    });

    await this.client.start();
    const authStatus = await this.client.getAuthStatus();
    if (!authStatus.isAuthenticated) {
      throw new Error(
        'GitHub Copilot CLI is not authenticated. Run `copilot auth login` or `gh auth login` and try again.'
      );
    }

    return this.client;
  }

  async stop(): Promise<void> {
    if (!this.client) {
      return;
    }

    await this.client.stop();
    this.client = undefined;
  }
}
