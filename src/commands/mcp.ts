import chalk from 'chalk';

export async function mcpCommand(): Promise<void> {
  console.log(chalk.cyan('\nStarting Context Frame MCP server...\n'));
  try {
    const { startMcpServer } = await import('../services/mcp-server.js');
    await startMcpServer();
  } catch (error) {
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}
