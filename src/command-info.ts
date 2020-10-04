import commander, { Command } from 'commander';
import { addPrintOptions, addSearchOptions, getOptions } from './options';
import { showGeneratorInfo } from './execute-info';

export function infoCommand(command: commander.Command) {
  command = command
    .command('info')
    .alias('i')
    .description('Show detailed information of a generator')
    .arguments('[generator]');

  command = addSearchOptions(command, {});

  command = addPrintOptions(command, {
    showBasePath: true,
    showSummary: true,
    showCommands: true,
    showDetails: true,
  });

  command = command.action((generator: string | undefined, args: Command) =>
    showGeneratorInfo({
      ...getOptions(args),
      generator,
    })
  );

  return command;
}
