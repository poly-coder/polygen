import { Command } from "commander";
import { infoCommand } from "./command-info";

import { initCommand } from "./command-init";
import { listCommand } from "./command-list";
import { logLevelOption } from "./logging";

const mainProgram = new Command();

mainProgram
    .storeOptionsAsProperties(false)
    .version('0.0.0')
    .name('polygen')
    .description('Polyglot code generator, based on models and templates you can own')
    .action(async (args) => args.help())
logLevelOption(mainProgram)

initCommand(mainProgram);
listCommand(mainProgram);
infoCommand(mainProgram);

mainProgram.parse(process.argv);
