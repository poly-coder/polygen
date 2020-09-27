import commander, { Command } from 'commander';
import { addPrintOptions, addSearchOptions, getOptions } from './options';
import { listGenerators } from './generator';

export function listCommand(command: commander.Command) {
  command = command.command('list').alias('ls').description('List existing generators');

  command = addSearchOptions(command, {});

  command = addPrintOptions(command, {
    showBasePath: false,
    showSummary: false,
    showCommands: false,
    showDetails: false,
  });

  command = command
    .arguments('[name]')
    .action((name: string | undefined, args: Command) =>
      listGenerators({
        ...getOptions(args),
        name,
      })
    );

  return command
}
