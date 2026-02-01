import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
import * as z from 'zod';
import { scanRepository } from './scanner';
import { calculateScore } from './scorer';
import { FILE_PATTERNS } from '../models/patterns';
import { MATURITY_LEVELS } from '../models/levels';

export async function startMcpServer(): Promise<void> {
  const server = new McpServer({
    name: 'context-frame',
    version: '1.1.0'
  });

  server.registerTool(
    'scan_repo',
    {
      description: 'Scan a repository path for context maturity and metrics.',
      inputSchema: {
        path: z.string().default('.')
      }
    },
    async ({ path }) => {
      const scanResult = await scanRepository(path);
      const score = calculateScore(scanResult);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ scanResult, score }, null, 2)
          }
        ]
      };
    }
  );

  server.registerTool(
    'get_recommendations',
    {
      description: 'Get top recommendations for improving context maturity.',
      inputSchema: {
        path: z.string().default('.')
      }
    },
    async ({ path }) => {
      const scanResult = await scanRepository(path);
      const score = calculateScore(scanResult);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ recommendations: score.recommendations }, null, 2)
          }
        ]
      };
    }
  );

  server.registerTool(
    'validate_refs',
    {
      description: 'Validate documentation references for a repository.',
      inputSchema: {
        path: z.string().default('.')
      }
    },
    async ({ path }) => {
      const scanResult = await scanRepository(path);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(scanResult.referenceValidation, null, 2)
          }
        ]
      };
    }
  );

  server.registerTool(
    'list_patterns',
    {
      description: 'List context file patterns used for scanning.',
      inputSchema: {}
    },
    async () => ({
      content: [
        {
          type: 'text',
          text: JSON.stringify(FILE_PATTERNS, null, 2)
        }
      ]
    })
  );

  server.registerTool(
    'list_levels',
    {
      description: 'List maturity levels and their requirements.',
      inputSchema: {}
    },
    async () => ({
      content: [
        {
          type: 'text',
          text: JSON.stringify(MATURITY_LEVELS, null, 2)
        }
      ]
    })
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log('Context Frame MCP server running on stdio.');
}
