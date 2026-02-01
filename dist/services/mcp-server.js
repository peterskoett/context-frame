"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.startMcpServer = startMcpServer;
const mcp_1 = require("@modelcontextprotocol/sdk/server/mcp");
const stdio_1 = require("@modelcontextprotocol/sdk/server/stdio");
const z = __importStar(require("zod"));
const scanner_1 = require("./scanner");
const scorer_1 = require("./scorer");
const patterns_1 = require("../models/patterns");
const levels_1 = require("../models/levels");
async function startMcpServer() {
    const server = new mcp_1.McpServer({
        name: 'context-frame',
        version: '1.1.0'
    });
    server.registerTool('scan_repo', {
        description: 'Scan a repository path for context maturity and metrics.',
        inputSchema: {
            path: z.string().default('.')
        }
    }, async ({ path }) => {
        const scanResult = await (0, scanner_1.scanRepository)(path);
        const score = (0, scorer_1.calculateScore)(scanResult);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ scanResult, score }, null, 2)
                }
            ]
        };
    });
    server.registerTool('get_recommendations', {
        description: 'Get top recommendations for improving context maturity.',
        inputSchema: {
            path: z.string().default('.')
        }
    }, async ({ path }) => {
        const scanResult = await (0, scanner_1.scanRepository)(path);
        const score = (0, scorer_1.calculateScore)(scanResult);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ recommendations: score.recommendations }, null, 2)
                }
            ]
        };
    });
    server.registerTool('validate_refs', {
        description: 'Validate documentation references for a repository.',
        inputSchema: {
            path: z.string().default('.')
        }
    }, async ({ path }) => {
        const scanResult = await (0, scanner_1.scanRepository)(path);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(scanResult.referenceValidation, null, 2)
                }
            ]
        };
    });
    server.registerTool('list_patterns', {
        description: 'List context file patterns used for scanning.',
        inputSchema: {}
    }, async () => ({
        content: [
            {
                type: 'text',
                text: JSON.stringify(patterns_1.FILE_PATTERNS, null, 2)
            }
        ]
    }));
    server.registerTool('list_levels', {
        description: 'List maturity levels and their requirements.',
        inputSchema: {}
    }, async () => ({
        content: [
            {
                type: 'text',
                text: JSON.stringify(levels_1.MATURITY_LEVELS, null, 2)
            }
        ]
    }));
    const transport = new stdio_1.StdioServerTransport();
    await server.connect(transport);
    console.log('Context Frame MCP server running on stdio.');
}
