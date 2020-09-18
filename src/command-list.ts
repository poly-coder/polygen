import commander from "commander";
import { printGeneratorInfo } from "./command-info";
import { getOptions, PCGenProgramOptions } from "./common";
import { getConsola } from "./logging";
import { createGeneratorsSystem, FetchGeneratorInfoOptions } from "./gen-system";

export interface ListCommandOptions extends PCGenProgramOptions, FetchGeneratorInfoOptions {
}

export function listCommand(command: commander.Command) {
    command
        .command("list")
        .alias('ls')
        .description("List existing generators and commands")
        .option('-d, --details', 'Show generator details', false)
        .option('-c, --commands', 'Show generator commands', false)
        .action(args => executeListCommand(getOptions(args)))
    }
    
async function executeListCommand(opts: ListCommandOptions) {
    const console = getConsola(opts);
    const genSystem = createGeneratorsSystem(console);

    if (!(await genSystem.ensureInitialized())) {
        return;
    }

    var infos = await genSystem.fetchGeneratorsInfo(opts)

    for (const info of infos) {
        printGeneratorInfo(info, console)
    }
}
