import commander, { Command } from 'commander';
import { addPrintOptions, addSearchOptions, getOptions } from './common';
import { listGenerators } from './generator';

export function listCommand(command: commander.Command) {
  command
    .command('list')
    .alias('ls')
    .description('List existing generators')
    // .arguments('[name]')
    .action((args: Command) => listGenerators(getOptions(args)));
  // .action((name: string | undefined, args: Command) => listGenerators({
  //   ...getOptions(args),
  //   name,
  // }));

  addSearchOptions(command, {});

  addPrintOptions(command, {
    showBasePath: false,
    showSummary: false,
  });
}
