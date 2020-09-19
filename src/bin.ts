import { Command } from "commander";
import { initCommand } from "./command-init";
// import { infoCommand } from "./command-info";
import { listCommand } from "./command-list";
// import { newCommand } from "./command-new";
import { logLevelOption } from "./logging";

const mainProgram = new Command();

mainProgram
    .storeOptionsAsProperties(false)
    .version('0.0.0')
    .name('pcgen')
    .description('Polyglot code generator, based on models and templates you can own')
    .action(async (args) => args.help())
logLevelOption(mainProgram)

initCommand(mainProgram);
listCommand(mainProgram);
// infoCommand(mainProgram);
// newCommand(mainProgram);

mainProgram.parse(process.argv);
