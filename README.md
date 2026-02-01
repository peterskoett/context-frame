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

# Launch interactive TUI
context-frame tui /path/to/repo
```

## TUI (Interactive Browser)

Use the TUI to browse detected context files with keyboard navigation and live filters.

```
context-frame tui [path]
```

Features:
- Colorized header/status when running in a TTY.
- Help screen (`?` or `h`) with key bindings.
- Search/filter (`/`) across path, tool, and pattern name.
- Sorting (`s`) by path, tool, weight, or level.

Key bindings:
- Arrows: move selection
- Enter: file details
- /: filter
- s: cycle sort order
- h or ?: help screen
- q or Esc: quit

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
- **Cursor**: .cursorrules, .cursor/rules/*.mdc
- **Goose**: HOWTOAI.md, .goosehints, .gooseignore
- **Cline**: .clinerules
- **Firebender**: firebender.json
- **AMP**: .amp/, amp.json
- **AI Rules**: ai-rules/, .generated-ai-rules/ (block/ai-rules automation)
- **OpenAI Codex**: CODEX.md, .codex/

## Recent Updates

- Added detection patterns for Goose, Cline, Firebender, AMP, and AI Rules:
  - Goose: HOWTOAI.md, .goosehints, .gooseignore
  - Cline: .clinerules
  - Firebender: firebender.json
  - AMP: .amp/, amp.json
  - AI Rules: ai-rules/, ai-rules/index.md, ai-rules/framework-overview.md, ai-rules/ai-usage-tracking.md, .generated-ai-rules/, @ai-rules/
- Fixed reference extraction to ignore fenced code blocks when parsing inline code paths.
- Replaced emoji in CLI output with ASCII to avoid mojibake on Windows terminals.

## Quality Scoring

Quality is measured on a 0-10 scale based on:

- **Sections**: Markdown headers (##, ###)
- **File Paths**: Concrete paths referenced
- **Commands**: CLI commands in backticks
- **Constraints**: Words like "never", "must", "avoid"
- **Word Count**: Documentation substance

## Example Output

```
===============================================================
                    CONTEXT FRAME REPORT
===============================================================

Repository: /path/to/project

MATURITY LEVEL
  Level 5: Multi-Agent Ready
  Multiple agents and MCP configurations

  #####--- 5/8

QUALITY SCORE
  8.5/10 (Weight: 45)
  #########-

TOOL COVERAGE
  Claude Code (weight: 25)
    - CLAUDE.md
    - AGENTS.md
  GitHub Copilot (weight: 10)
    - .github/copilot-instructions.md
  Cursor (weight: 10)
    - .cursorrules

RECOMMENDATIONS
  -> Create ARCHITECTURE.md to document your system design
  -> Set up .claude/commands/ for custom automation
===============================================================
```

## Roadmap

See [TODO.md](./TODO.md) for planned features including:
- GitHub Action for CI
- VS Code extension

## Inspiration

This project combines ideas from:

- [measuring-ai-proficiency](https://github.com/pskoett/measuring-ai-proficiency) - 8-level maturity model
- [Primer](https://github.com/pierceboggan/primer) - Sub-agent codebase analysis
- [GitHub Copilot SDK](https://github.com/github/copilot-sdk) - Agentic workflows
- [Advanced Context Engineering for Coding Agents (ACE-FCA)](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/ace-fca.md) - Frequent intentional compaction, spec-driven development, large-context workflows
- [Goose HOWTOAI](https://github.com/block/goose/blob/main/HOWTOAI.md) - Best practices for AI-assisted development, security, workflow tips
- [AI-Assisted Development at Block](https://engineering.block.xyz/blog/ai-assisted-development-at-block) - Block's AI Champions program, RPI workflow, repo readiness patterns
- [block/ai-rules](https://github.com/block/ai-rules) - CLI for generating AI context files across tools

## License

MIT
