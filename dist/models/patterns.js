"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FILE_PATTERNS = void 0;
exports.getPatternsByTool = getPatternsByTool;
exports.getPatternsByLevel = getPatternsByLevel;
exports.FILE_PATTERNS = [
    // Claude Code patterns
    {
        name: "Claude Instructions",
        tool: "Claude Code",
        patterns: ["CLAUDE.md", "claude.md"],
        weight: 10,
        level: 2
    },
    {
        name: "Claude Agents",
        tool: "Claude Code",
        patterns: ["AGENTS.md", "agents.md"],
        weight: 15,
        level: 5
    },
    {
        name: "Claude Directory",
        tool: "Claude Code",
        patterns: [".claude/"],
        weight: 10,
        level: 4
    },
    {
        name: "Claude Settings",
        tool: "Claude Code",
        patterns: [".claude/settings.json", ".claude/settings.local.json"],
        weight: 8,
        level: 4
    },
    {
        name: "Claude Commands",
        tool: "Claude Code",
        patterns: [".claude/commands/"],
        weight: 12,
        level: 4
    },
    {
        name: "Claude MCP Config",
        tool: "Claude Code",
        patterns: [".claude/mcp.json"],
        weight: 15,
        level: 5
    },
    // GitHub Copilot patterns
    {
        name: "Copilot Instructions",
        tool: "GitHub Copilot",
        patterns: [".github/copilot-instructions.md"],
        weight: 10,
        level: 2
    },
    {
        name: "Copilot Agents",
        tool: "GitHub Copilot",
        patterns: [".github/agents/"],
        weight: 15,
        level: 5
    },
    // Cursor patterns
    {
        name: "Cursor Rules (legacy)",
        tool: "Cursor",
        patterns: [".cursorrules"],
        weight: 10,
        level: 2
    },
    {
        name: "Cursor Rules Directory",
        tool: "Cursor",
        patterns: [".cursor/rules/", ".cursor/rules/*.mdc"],
        weight: 12,
        level: 3
    },
    // OpenAI Codex patterns
    {
        name: "Codex Instructions",
        tool: "OpenAI Codex",
        patterns: ["CODEX.md", "codex.md"],
        weight: 10,
        level: 2
    },
    {
        name: "Codex Directory",
        tool: "OpenAI Codex",
        patterns: [".codex/"],
        weight: 10,
        level: 4
    },
    // Comprehensive context patterns
    {
        name: "Architecture Documentation",
        tool: "Generic",
        patterns: ["ARCHITECTURE.md", "architecture.md", "docs/architecture.md"],
        weight: 12,
        level: 3
    },
    {
        name: "Conventions Documentation",
        tool: "Generic",
        patterns: ["CONVENTIONS.md", "conventions.md", "STYLE.md"],
        weight: 10,
        level: 3
    },
    {
        name: "API Documentation",
        tool: "Generic",
        patterns: ["API.md", "api.md", "docs/api.md"],
        weight: 8,
        level: 3
    },
    {
        name: "Contributing Guidelines",
        tool: "Generic",
        patterns: ["CONTRIBUTING.md", "contributing.md"],
        weight: 6,
        level: 3
    },
    // MCP patterns
    {
        name: "MCP Configuration",
        tool: "Generic",
        patterns: ["mcp.json", ".mcp.json"],
        weight: 15,
        level: 5
    }
];
function getPatternsByTool(tool) {
    return exports.FILE_PATTERNS.filter(p => p.tool === tool);
}
function getPatternsByLevel(level) {
    return exports.FILE_PATTERNS.filter(p => p.level === level);
}
