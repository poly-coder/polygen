import commander, { Command } from 'commander';
import { addPrintOptions, addSearchOptions, getOptions } from './common';
import { showGeneratorInfo } from './generator';

export function infoCommand(command: commander.Command) {
  command
    .command('info')
    .alias('i')
    .description('Show detailed information of a generator')
    .action((args: Command) => showGeneratorInfo(getOptions(args)));

  addSearchOptions(command, {});

  addPrintOptions(command, {
      showBasePath: true,
      showSummary: true,
    })
  }
