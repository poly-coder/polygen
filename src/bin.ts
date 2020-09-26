import { Command } from "commander";
import { initCommand } from "./command-init";
import { infoCommand } from "./command-info";
import { listCommand } from "./command-list";
// import { newCommand } from "./command-new";
import { parseLogLevel } from "./logging";
import { LogLevel } from "consola";

const mainProgram = new Command();

mainProgram
    .storeOptionsAsProperties(false)
    .version('0.0.0')
    .name('pcgen')
    .description('Polyglot code generator, based on models and templates you can own')
    .option('--config-file <file.js>', 'Configuration file name for pcgen. Defaults to ".pcgen.json"')
    .option(
        '-l, --log-level <level>', 
        'Log level. Any of: fatal or f, error or e, warning or warn or w, log or l, information or info or i, success or s, debug or d, trace or t, silent or verbose or v',
        parseLogLevel,
        LogLevel.Info)
    .action(async (args) => args.help())

initCommand(mainProgram);
listCommand(mainProgram);
infoCommand(mainProgram);
// newCommand(mainProgram);

mainProgram.parse(process.argv);
