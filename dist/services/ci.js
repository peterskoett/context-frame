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
exports.runCi = runCi;
exports.initCiWorkflow = initCiWorkflow;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const config_1 = require("./config");
const scanner_1 = require("./scanner");
const scorer_1 = require("./scorer");
const WORKFLOW_TEMPLATE = `name: Context Frame

on:
  pull_request:
  push:
    branches: [ main, master ]

jobs:
  context-frame:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npx context-frame ci .
`;
async function runCi(targetPath) {
    const scanResult = await (0, scanner_1.scanRepository)(targetPath);
    const score = (0, scorer_1.calculateScore)(scanResult);
    const config = (0, config_1.loadConfig)(scanResult.basePath);
    const thresholds = config.thresholds ?? {};
    const minLevel = thresholds.minLevel ?? 0;
    const minQualityScore = thresholds.minQualityScore ?? 0;
    const minResolvedRefsRate = thresholds.minResolvedRefsRate ?? 0;
    const failReasons = [];
    if (score.maturityLevel < minLevel) {
        failReasons.push(`Level ${score.maturityLevel} < ${minLevel}`);
    }
    if (score.qualityScore < minQualityScore) {
        failReasons.push(`Quality ${score.qualityScore} < ${minQualityScore}`);
    }
    if (scanResult.referenceValidation.resolutionRate < minResolvedRefsRate) {
        failReasons.push(`Reference resolution ${Math.round(scanResult.referenceValidation.resolutionRate * 100)}% < ${Math.round(minResolvedRefsRate * 100)}%`);
    }
    const report = {
        repository: scanResult.basePath,
        maturityLevel: score.maturityLevel,
        qualityScore: score.qualityScore,
        referenceResolutionRate: scanResult.referenceValidation.resolutionRate,
        thresholds: {
            minLevel,
            minQualityScore,
            minResolvedRefsRate
        },
        failReasons
    };
    return { exitCode: failReasons.length > 0 ? 1 : 0, report };
}
function initCiWorkflow(basePath) {
    const workflowPath = path.join(basePath, '.github', 'workflows', 'context-frame.yml');
    fs.mkdirSync(path.dirname(workflowPath), { recursive: true });
    fs.writeFileSync(workflowPath, WORKFLOW_TEMPLATE, 'utf-8');
    return workflowPath;
}
