import commander, { Command } from 'commander';
import { getOptions } from './common';
import { showGeneratorInfo } from './generator';

export function infoCommand(command: commander.Command) {
  command
    .command('info')
    .alias('i')
    .description('Show detailed information of a generator')
    .arguments('<generator>')
    .action((generatorName: string, args: Command) =>
      showGeneratorInfo({
        ...getOptions(args),
        generatorName,
      })
    );
}
