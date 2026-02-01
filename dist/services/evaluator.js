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
exports.runEvaluation = runEvaluation;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const copilot_client_1 = require("./copilot-client");
async function runEvaluation(configPath, basePath) {
    const config = loadEvalConfig(configPath, basePath);
    const manager = new copilot_client_1.CopilotClientManager({ workspacePath: basePath });
    const client = await manager.start();
    try {
        const results = [];
        for (const prompt of config.prompts) {
            const withoutContext = await runPrompt(client, config.model ?? 'gpt-5', prompt.prompt);
            const withContext = await runPrompt(client, config.model ?? 'gpt-5', buildContextPrompt(prompt.prompt, config.contextFiles ?? [], basePath));
            const judge = await runJudge(client, config.judgeModel ?? 'gpt-5', config.rubric ?? defaultRubric(), prompt.prompt, withoutContext, withContext);
            results.push({
                promptId: prompt.id ?? prompt.prompt.slice(0, 32),
                prompt: prompt.prompt,
                withoutContext,
                withContext,
                judge
            });
        }
        return results;
    }
    finally {
        await manager.stop();
    }
}
function loadEvalConfig(configPath, basePath) {
    const fullPath = path.isAbsolute(configPath) ? configPath : path.join(basePath, configPath);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const parsed = JSON.parse(content);
    if (!parsed.prompts || parsed.prompts.length === 0) {
        throw new Error('Eval config must include prompts.');
    }
    return parsed;
}
async function runPrompt(client, model, prompt) {
    const session = await client.createSession({ model });
    try {
        const response = await session.sendAndWait({ prompt });
        return response?.data?.content?.trim() ?? '';
    }
    finally {
        await session.destroy();
    }
}
function buildContextPrompt(prompt, contextFiles, basePath) {
    if (contextFiles.length === 0) {
        return prompt;
    }
    const contextBlocks = contextFiles
        .map(file => {
        const fullPath = path.isAbsolute(file) ? file : path.join(basePath, file);
        const content = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf-8') : '';
        return `### ${file}\n${content}`;
    })
        .join('\n\n');
    return `${prompt}\n\nContext:\n${contextBlocks}`;
}
async function runJudge(client, model, rubric, prompt, withoutContext, withContext) {
    const judgePrompt = [
        'You are a strict evaluator. Score each answer from 1-10.',
        rubric,
        'Prompt:',
        prompt,
        'Answer A (no context):',
        withoutContext,
        'Answer B (with context):',
        withContext,
        'Respond in JSON with keys: scoreWithout, scoreWith, verdict.'
    ].join('\n\n');
    const session = await client.createSession({ model });
    try {
        const response = await session.sendAndWait({ prompt: judgePrompt });
        const content = response?.data?.content ?? '{}';
        const json = extractJson(content);
        return {
            scoreWithout: Number(json.scoreWithout ?? 0),
            scoreWith: Number(json.scoreWith ?? 0),
            verdict: String(json.verdict ?? '')
        };
    }
    finally {
        await session.destroy();
    }
}
function extractJson(text) {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
        return {};
    }
    try {
        return JSON.parse(match[0]);
    }
    catch {
        return {};
    }
}
function defaultRubric() {
    return 'Judge correctness, completeness, and adherence to repo conventions.';
}
