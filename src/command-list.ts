import commander, { Command } from 'commander';
import { addPrintOptions, addSearchOptions, getOptions } from './options';
import { listGenerators } from './execute-list';

export function listCommand(command: commander.Command) {
  command = command.command('list').alias('ls').description('List existing generators');

  command = addSearchOptions(command);

  command = addPrintOptions(command, {
    showBasePath: false,
    showSummary: false,
    showCommands: false,
    showDetails: false,
  });

  command = command
    .arguments('[generator]')
    .action((generator: string | undefined, args: Command) =>
      listGenerators({
        ...getOptions(args),
        generator,
      })
    );

  return command
}
