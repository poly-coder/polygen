import { Command } from 'commander';
import { initCommand } from './command-init';
import { listCommand } from './command-list';
import { infoCommand } from './command-info';
import { newCommand } from "./command-new";
import { addGlobalOptions } from './options';

let mainProgram = new Command();

mainProgram = mainProgram
  .storeOptionsAsProperties(false)
  .version('0.0.0')
  .name('pcgen')
  .description(
    'Polyglot code generator, based on models and templates you can own'
  );

mainProgram = addGlobalOptions(mainProgram);

mainProgram = mainProgram
  .action(async (args) => args.help());

initCommand(mainProgram);
listCommand(mainProgram);
infoCommand(mainProgram);
newCommand(mainProgram);

mainProgram.parse(process.argv);
