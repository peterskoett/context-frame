import * as fs from 'fs';
import * as path from 'path';

export type TemplateName = 'react' | 'node' | 'python' | 'go' | 'rust';

interface TemplateFile {
  path: string;
  content: string;
}

const TEMPLATE_MAP: Record<TemplateName, TemplateFile[]> = {
  react: [
    {
      path: 'CLAUDE.md',
      content: `# React Context\n\n- Use component-driven architecture.\n- Prefer functional components and hooks.\n- Keep props typed and minimal.\n`
    },
    {
      path: 'ARCHITECTURE.md',
      content: `# Architecture\n\n## UI Layers\n- Components\n- Pages\n- State management\n\n## Build\n- Vite/CRA setup\n- Environment configs\n`
    },
    {
      path: 'CONVENTIONS.md',
      content: `# Conventions\n\n- Use .tsx for components\n- Keep hooks in /hooks\n- Prefer colocated styles\n`
    },
    {
      path: '.github/copilot-instructions.md',
      content: `# Copilot Instructions\n\n- Use React 18 patterns\n- Avoid deprecated lifecycle methods\n`
    }
  ],
  node: [
    {
      path: 'CLAUDE.md',
      content: `# Node Context\n\n- Use async/await\n- Prefer small modules\n`
    },
    {
      path: 'ARCHITECTURE.md',
      content: `# Architecture\n\n## Services\n- API layer\n- Data access\n- Background jobs\n`
    },
    {
      path: 'CONVENTIONS.md',
      content: `# Conventions\n\n- Use eslint + prettier\n- Keep config in /config\n`
    },
    {
      path: '.github/copilot-instructions.md',
      content: `# Copilot Instructions\n\n- Use Node 20 APIs\n- Keep dependencies minimal\n`
    }
  ],
  python: [
    {
      path: 'CLAUDE.md',
      content: `# Python Context\n\n- Use type hints\n- Prefer small modules\n`
    },
    {
      path: 'ARCHITECTURE.md',
      content: `# Architecture\n\n## Packages\n- Core\n- Services\n- CLI\n`
    },
    {
      path: 'CONVENTIONS.md',
      content: `# Conventions\n\n- Use black + ruff\n- Keep requirements pinned\n`
    }
  ],
  go: [
    {
      path: 'CLAUDE.md',
      content: `# Go Context\n\n- Keep packages small\n- Prefer composition\n`
    },
    {
      path: 'ARCHITECTURE.md',
      content: `# Architecture\n\n## Modules\n- cmd/\n- internal/\n- pkg/\n`
    },
    {
      path: 'CONVENTIONS.md',
      content: `# Conventions\n\n- Use gofmt\n- Keep interfaces minimal\n`
    }
  ],
  rust: [
    {
      path: 'CLAUDE.md',
      content: `# Rust Context\n\n- Prefer explicit lifetimes\n- Use clippy defaults\n`
    },
    {
      path: 'ARCHITECTURE.md',
      content: `# Architecture\n\n## Crates\n- core\n- cli\n- services\n`
    },
    {
      path: 'CONVENTIONS.md',
      content: `# Conventions\n\n- Use rustfmt\n- Keep modules shallow\n`
    }
  ]
};

export function generateTemplate(template: TemplateName, basePath: string): string[] {
  const files = TEMPLATE_MAP[template];
  if (!files) {
    throw new Error(`Unknown template: ${template}`);
  }

  const created: string[] = [];
  for (const file of files) {
    const fullPath = path.join(basePath, file.path);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, file.content, 'utf-8');
    created.push(file.path);
  }
  return created;
}
