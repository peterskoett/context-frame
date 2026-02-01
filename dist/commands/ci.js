"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ciCommand = ciCommand;
const chalk_1 = __importDefault(require("chalk"));
const ci_1 = require("../services/ci");
async function ciCommand(targetPath, options) {
    if (options.init) {
        const workflowPath = (0, ci_1.initCiWorkflow)(targetPath);
        console.log(chalk_1.default.green(`Wrote workflow to ${workflowPath}`));
        return;
    }
    const result = await (0, ci_1.runCi)(targetPath);
    console.log(JSON.stringify(result.report, null, 2));
    process.exit(result.exitCode);
}
