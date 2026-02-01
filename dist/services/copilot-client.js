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
exports.CopilotClientManager = void 0;
class CopilotClientManager {
    constructor(config) {
        this.config = config;
    }
    async start() {
        if (this.client) {
            return this.client;
        }
        const { CopilotClient: CopilotClientCtor } = await Promise.resolve().then(() => __importStar(require('@github/copilot-sdk')));
        this.client = new CopilotClientCtor({
            cwd: this.config.workspacePath,
            cliPath: this.config.cliPath,
            cliUrl: this.config.cliUrl,
            logLevel: this.config.logLevel ?? 'warning'
        });
        await this.client.start();
        const authStatus = await this.client.getAuthStatus();
        if (!authStatus.isAuthenticated) {
            throw new Error('GitHub Copilot CLI is not authenticated. Run `copilot auth login` or `gh auth login` and try again.');
        }
        return this.client;
    }
    async stop() {
        if (!this.client) {
            return;
        }
        await this.client.stop();
        this.client = undefined;
    }
}
exports.CopilotClientManager = CopilotClientManager;
