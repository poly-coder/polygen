import commander from "commander";
import chalk from "chalk";
import { getOptions, PCGenProgramOptions } from "./common";
import { getConsola } from "./logging";
import { createGeneratorsSystem } from "./gen-system";
import { InitializeOptions } from "./gen-types";
import { readGeneratorSystemConfig } from "./gen-configuration";

export interface InitCommandOptions extends PCGenProgramOptions, InitializeOptions {
}

export function initCommand(command: commander.Command) {
    command
        .command("init")
        .alias('initialize')
        .description("Creates a new generator")
        .option('-s, --search-paths', 'Paths where to locate generators, separated by semicolon')
        .option('-b, --base-path', 'Paths where to locate local generators and create new ones. Created with pcgen init')
        .option('-p, --pcgen-folder', 'pcgen folder where generators are located, relative to base path')
        .option('-c, --commands-folder', 'Commands folder where commands are located, relative to generator folder')
        .option('-t, --templates-folder', 'Templates folder where templates are located, relative to generator folder')
        .option('-d, --default-command', 'Default command used when a generator is executed')
        .option('--cwd', 'Current working directory where new files are generated relative to it')
        .action(args => executeInitCommand(getOptions(args)))
    }
    
async function executeInitCommand(opts: InitCommandOptions) {
    const console = getConsola(opts);
    const config = await readGeneratorSystemConfig(console)
    const genSystem = createGeneratorsSystem(config, console);

    if (await genSystem.isInitialized()) {
        console.info(chalk.greenBright('pcgen settings are already initialized!'))
        return;
    }

    genSystem.initialize(opts);

    console.info(chalk.greenBright('pcgen settings initialized!'))
}
