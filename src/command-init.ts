import commander from "commander";
import chalk from "chalk";
import { getOptions, PolyGenProgramOptions } from "./common";
import { getConsola } from "./logging";
import { createTemplateSystem } from "./templates";

export interface InitCommandOptions extends PolyGenProgramOptions {
}

export function initCommand(command: commander.Command) {
    command
        .command("init")
        .alias('i')
        .description("Creates a new generator")
        // .requiredOption('-p, --project <value>', 'Generator name. Must be compatible with the file system.')
        .action(args => executeInitCommand(getOptions(args)))
    }
    
async function executeInitCommand(opts: InitCommandOptions) {
    const console = getConsola(opts);
    const templates = createTemplateSystem(console);

    if (await templates.isInitialized()) {
        console.info(chalk.greenBright('Polygen settings were already initialized!'))
        return;
    }

    templates.initialize();
    console.info(chalk.greenBright('Polygen settings initialized!'))
}