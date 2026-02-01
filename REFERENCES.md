# Context Engineering References

Curated resources for AI context engineering patterns and best practices.

## Core References

### [AI-Assisted Development at Block](https://engineering.block.xyz/blog/ai-assisted-development-at-block)
Block's engineering blog on how they scaled AI-assisted development across 95% of engineers.

**Key takeaways:**
- **AI Champions Program** - 50 developers dedicating 30% time to AI enablement at repo level
- **Repo Readiness Tiers** - Locked → Novice → Adept → Artisan progression
- **RPI Workflow** - Research → Plan → Implement for complex tasks
- **Hierarchical Context** - Root-level → Service-level → Subdirectory-level context files
- **Automated PRs** - Agents assigned tickets directly from Linear/Jira
- **Results** - 69% jump in AI-authored code, 37% reported time savings, 21× automated PRs

**Repo Quest Challenges:**
1. Set up AI context files (AGENTS.md, HOWTOAI.md)
2. Create repeatable agent skills
3. Enable automated AI code review
4. Set up headless AI assistance
5. Add PR labels for AI contribution tracking
6. Wire AI into CI/CD pipeline

---

### [ACE-FCA: Advanced Context Engineering](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/ace-fca.md)
HumanLayer's guide to "frequent intentional compaction" for coding agents.

**Key concepts:**
- **Frequent Intentional Compaction** - Deliberately structure context throughout development
- **Spec-Driven Development** - Specs become the real code, not the generated output
- **Context Utilization** - Keep at 40-60% range, not maxed out
- **RPI Workflow** - Research (explore codebase) → Plan (document approach) → Implement (execute with fresh context)

**What eats context:**
- Searching for files
- Understanding code flow
- Applying edits
- Test/build logs
- Huge JSON blobs from tools

---

### [Goose HOWTOAI](https://github.com/block/goose/blob/main/HOWTOAI.md)
Practical guide for AI-assisted development with Goose.

**Best practices:**
- ✅ Generating boilerplate and common patterns
- ✅ Creating comprehensive test suites
- ✅ Writing documentation and comments
- ✅ Refactoring existing code for clarity
- ❌ Complex business logic without thorough review
- ❌ Security critical code
- ❌ Code you don't fully understand

**Workflow tips:**
- Start small and validate often
- Study existing patterns before generating new code
- Always ask: "Is this secure? Does it follow project patterns?"

---

### [block/ai-rules](https://github.com/block/ai-rules)
CLI for generating AI context files across multiple tools.

```bash
$ ai-rules init

# Analyzes codebase → Generates ai-rules/index.md → Creates agent-specific configs
# Outputs: CLAUDE.md, AGENTS.md, .cursor/rules/, .clinerules/, firebender.json
```

---

## Additional Resources

- [measuring-ai-proficiency](https://github.com/pskoett/measuring-ai-proficiency) - 8-level maturity model
- [Primer](https://github.com/pierceboggan/primer) - Sub-agent codebase analysis
- [GitHub Copilot SDK](https://github.com/github/copilot-sdk) - Agentic workflows
- [AgentSkills.io](https://agentskills.io/home) - Packaged, reusable agent workflows

---

## Supported Tools & Their Context Files

| Tool | Primary Files | Level |
|------|--------------|-------|
| Claude Code | CLAUDE.md, AGENTS.md, .claude/ | 2-5 |
| GitHub Copilot | .github/copilot-instructions.md | 2-5 |
| Cursor | .cursorrules, .cursor/rules/*.mdc | 2-3 |
| Goose | HOWTOAI.md, .goosehints, .gooseignore | 2 |
| Cline | .clinerules | 2 |
| Firebender | firebender.json | 2 |
| AMP | .amp/, amp.json | 3 |
| AI Rules | ai-rules/, .generated-ai-rules/ | 4-5 |
| OpenAI Codex | CODEX.md, .codex/ | 2-4 |
