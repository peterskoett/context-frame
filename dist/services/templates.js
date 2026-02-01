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
exports.generateTemplate = generateTemplate;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const TEMPLATE_MAP = {
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
function generateTemplate(template, basePath) {
    const files = TEMPLATE_MAP[template];
    if (!files) {
        throw new Error(`Unknown template: ${template}`);
    }
    const created = [];
    for (const file of files) {
        const fullPath = path.join(basePath, file.path);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, file.content, 'utf-8');
        created.push(file.path);
    }
    return created;
}
