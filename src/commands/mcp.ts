import chalk from 'chalk';
import { startMcpServer } from '../services/mcp-server';

export async function mcpCommand(): Promise<void> {
  console.log(chalk.cyan('\nStarting Context Frame MCP server...\n'));
  try {
    await startMcpServer();
  } catch (error) {
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}
