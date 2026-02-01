"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MATURITY_LEVELS = void 0;
exports.getLevelByNumber = getLevelByNumber;
exports.MATURITY_LEVELS = [
    {
        level: 1,
        name: "Zero AI",
        description: "No AI context files detected - baseline state",
        requirements: []
    },
    {
        level: 2,
        name: "Basic Instructions",
        description: "Basic AI instruction files present",
        requirements: ["CLAUDE.md", ".cursorrules", ".github/copilot-instructions.md", "CODEX.md"]
    },
    {
        level: 3,
        name: "Comprehensive Context",
        description: "Rich context with architecture and conventions",
        requirements: ["ARCHITECTURE.md", "CONVENTIONS.md", "API.md", "CONTRIBUTING.md"]
    },
    {
        level: 4,
        name: "Skills & Automation",
        description: "Hooks, commands, and memory files configured",
        requirements: [".claude/settings.json", ".claude/commands/", "hooks", "memory files"]
    },
    {
        level: 5,
        name: "Multi-Agent Ready",
        description: "Multiple agents and MCP configurations",
        requirements: ["AGENTS.md", ".github/agents/", "mcp.json", ".claude/mcp.json"]
    },
    {
        level: 6,
        name: "Fleet Coordination",
        description: "Coordinated multi-agent workflows",
        requirements: ["agent orchestration", "shared context protocols"]
    },
    {
        level: 7,
        name: "Enterprise Fleet",
        description: "Enterprise-scale agent management",
        requirements: ["centralized governance", "audit trails"]
    },
    {
        level: 8,
        name: "Autonomous Fleet",
        description: "Self-organizing agent ecosystems",
        requirements: ["autonomous optimization", "emergent behaviors"]
    }
];
function getLevelByNumber(level) {
    return exports.MATURITY_LEVELS.find(l => l.level === level);
}
