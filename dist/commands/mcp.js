"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mcpCommand = mcpCommand;
const chalk_1 = __importDefault(require("chalk"));
const mcp_server_1 = require("../services/mcp-server");
async function mcpCommand() {
    console.log(chalk_1.default.cyan('\nStarting Context Frame MCP server...\n'));
    try {
        await (0, mcp_server_1.startMcpServer)();
    }
    catch (error) {
        console.error(chalk_1.default.red(`Error: ${error.message}`));
        process.exit(1);
    }
}
