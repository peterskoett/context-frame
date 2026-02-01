# Context Frame

**Measure AI context maturity in your codebase.**

Context Frame scans repositories for AI context engineering artifacts and calculates a maturity score based on an 8-level model.

## Installation

```bash
npm install -g context-frame
```

## Quick Start

```bash
# Scan current directory
context-frame scan

# Scan specific path
context-frame scan /path/to/repo

# Generate JSON report
context-frame report /path/to/repo --format json

# Generate markdown report
context-frame report /path/to/repo --format markdown
```

## Maturity Levels

| Level | Name | Description |
|-------|------|-------------|
| 1 | Zero AI | No AI context files detected - baseline |
| 2 | Basic Instructions | CLAUDE.md, .cursorrules, copilot-instructions.md |
| 3 | Comprehensive Context | Architecture, conventions, API docs |
| 4 | Skills & Automation | Hooks, commands, memory files |
| 5 | Multi-Agent Ready | AGENTS.md, MCP configs, multiple agents |
| 6 | Fleet Coordination | Coordinated multi-agent workflows |
| 7 | Enterprise Fleet | Governance, audit trails |
| 8 | Autonomous Fleet | Self-organizing agent ecosystems |

## Supported Tools

- **Claude Code**: CLAUDE.md, AGENTS.md, .claude/
- **GitHub Copilot**: .github/copilot-instructions.md, .github/agents/
- **Cursor**: .cursorrules, .cursor/rules/
- **Goose**: HOWTOAI.md, .goosehints, .gooseignore
- **OpenAI Codex**: CODEX.md, .codex/

## Quality Scoring

Quality is measured on a 0-10 scale based on:

- **Sections**: Markdown headers (##, ###)
- **File Paths**: Concrete paths referenced
- **Commands**: CLI commands in backticks
- **Constraints**: Words like "never", "must", "avoid"
- **Word Count**: Documentation substance

## Example Output

```
═══════════════════════════════════════════════════════════════
                    CONTEXT FRAME REPORT
═══════════════════════════════════════════════════════════════

Repository: /path/to/project

MATURITY LEVEL
  Level 5: Multi-Agent Ready
  Multiple agents and MCP configurations

  █████░░░ 5/8

QUALITY SCORE
  8.5/10 (Weight: 45)
  █████████░

TOOL COVERAGE
  Claude Code (weight: 25)
    - CLAUDE.md
    - AGENTS.md
  GitHub Copilot (weight: 10)
    - .github/copilot-instructions.md
  Cursor (weight: 10)
    - .cursorrules

RECOMMENDATIONS
  → Create ARCHITECTURE.md to document your system design
  → Set up .claude/commands/ for custom automation
═══════════════════════════════════════════════════════════════
```

## Roadmap

See [TODO.md](./TODO.md) for planned features including:
- 🎨 **TUI Interface** via [OpenTUI](https://github.com/anomalyco/opentui)
- GitHub Action for CI
- VS Code extension

## Inspiration

This project combines ideas from:

- [measuring-ai-proficiency](https://github.com/pskoett/measuring-ai-proficiency) - 8-level maturity model
- [Primer](https://github.com/pierceboggan/primer) - Sub-agent codebase analysis
- [GitHub Copilot SDK](https://github.com/github/copilot-sdk) - Agentic workflows
- [Advanced Context Engineering for Coding Agents (ACE-FCA)](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/ace-fca.md) - Frequent intentional compaction, spec-driven development, large-context workflows
- [Goose HOWTOAI](https://github.com/block/goose/blob/main/HOWTOAI.md) - Best practices for AI-assisted development, security, workflow tips

## License

MIT
