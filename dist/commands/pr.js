"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prCommand = prCommand;
const chalk_1 = __importDefault(require("chalk"));
const pr_1 = require("../services/pr");
async function prCommand(repo) {
    console.log(chalk_1.default.cyan(`\nCreating PR for ${repo}...\n`));
    try {
        await (0, pr_1.createContextPr)(repo);
        console.log(chalk_1.default.green('PR created successfully.'));
    }
    catch (error) {
        console.error(chalk_1.default.red(`Error: ${error.message}`));
        process.exit(1);
    }
}
