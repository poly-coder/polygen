import commander, { Command } from 'commander';
import { addPrintOptions, addSearchOptions, getOptions } from './options';
import { showGeneratorInfo } from './generator';

export function infoCommand(command: commander.Command) {
  command = command
    .command('info')
    .alias('i')
    .description('Show detailed information of a generator')
    .arguments('[name]');

  command = addSearchOptions(command, {});

  command = addPrintOptions(command, {
    showBasePath: true,
    showSummary: true,
    showCommands: true,
    showDetails: true,
  });

  command = command.action((name: string | undefined, args: Command) =>
    showGeneratorInfo({
      ...getOptions(args),
      name,
    })
  );

  return command;
}
