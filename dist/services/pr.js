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
exports.createContextPr = createContextPr;
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const agent_1 = require("./agent");
async function createContextPr(repo) {
    ensureGh();
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'context-frame-'));
    const cloneResult = (0, child_process_1.spawnSync)('gh', ['repo', 'clone', repo, workspace], { encoding: 'utf-8' });
    if (cloneResult.status !== 0) {
        throw new Error(`Failed to clone ${repo}.`);
    }
    const branchName = `context-frame/${Date.now()}`;
    runGit(workspace, ['checkout', '-b', branchName]);
    await (0, agent_1.runAgentFlow)(workspace, 'improve');
    runGit(workspace, ['add', '.']);
    runGit(workspace, ['commit', '-m', 'Add context documentation']);
    runGit(workspace, ['push', '-u', 'origin', branchName]);
    const prResult = (0, child_process_1.spawnSync)('gh', ['pr', 'create', '--title', 'Add context documentation', '--body', 'Automated context improvements.'], {
        cwd: workspace,
        encoding: 'utf-8'
    });
    if (prResult.status !== 0) {
        throw new Error('Failed to create PR.');
    }
}
function ensureGh() {
    const result = (0, child_process_1.spawnSync)('gh', ['--version'], { encoding: 'utf-8' });
    if (result.status !== 0) {
        throw new Error('GitHub CLI (gh) is required.');
    }
}
function runGit(cwd, args) {
    const result = (0, child_process_1.spawnSync)('git', args, { cwd, encoding: 'utf-8' });
    if (result.status !== 0) {
        throw new Error(`git ${args.join(' ')} failed.`);
    }
}
