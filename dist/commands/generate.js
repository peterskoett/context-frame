"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCommand = generateCommand;
const chalk_1 = __importDefault(require("chalk"));
const templates_1 = require("../services/templates");
async function generateCommand(template, targetPath) {
    console.log(chalk_1.default.cyan(`\nGenerating context templates (${template})...\n`));
    try {
        const created = (0, templates_1.generateTemplate)(template, targetPath);
        console.log(chalk_1.default.green(`Generated ${created.length} files:`));
        for (const file of created) {
            console.log(chalk_1.default.gray(`- ${file}`));
        }
    }
    catch (error) {
        console.error(chalk_1.default.red(`Error: ${error.message}`));
        process.exit(1);
    }
}
