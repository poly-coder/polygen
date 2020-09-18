import commander from "commander";
import chalk from "chalk";
import { getOptions, PCGenProgramOptions } from "./common";
import { getConsola } from "./logging";
import { createGeneratorsSystem } from "./gen-system";

export interface InitCommandOptions extends PCGenProgramOptions {
}

export function initCommand(command: commander.Command) {
    command
        .command("init")
        .alias('i')
        .description("Creates a new generator")
        .action(args => executeInitCommand(getOptions(args)))
    }
    
async function executeInitCommand(opts: InitCommandOptions) {
    const console = getConsola(opts);
    const genSystem = createGeneratorsSystem(console);

    if (await genSystem.isInitialized()) {
        console.info(chalk.greenBright('pcgen settings were already initialized!'))
        return;
    }

    genSystem.initialize();
    console.info(chalk.greenBright('pcgen settings initialized!'))
}