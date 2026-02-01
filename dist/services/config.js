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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const DEFAULT_CONFIG = {
    skipPatterns: ['**/node_modules/**', '**/.git/**', '**/dist/**']
};
function loadConfig(basePath) {
    const candidates = ['.context-frame.yaml', '.context-frame.yml'];
    for (const name of candidates) {
        const fullPath = path.join(basePath, name);
        if (!fs.existsSync(fullPath)) {
            continue;
        }
        const content = fs.readFileSync(fullPath, 'utf-8');
        const parsed = (js_yaml_1.default.load(content) ?? {});
        return normalizeConfig(parsed);
    }
    return normalizeConfig({});
}
function normalizeConfig(config) {
    return {
        tools: config.tools,
        thresholds: config.thresholds,
        skipPatterns: config.skipPatterns?.length ? config.skipPatterns : DEFAULT_CONFIG.skipPatterns
    };
}
