import commander, { Command } from 'commander';
import { getOptions } from './common';
import { listGenerators } from './generator';

export function listCommand(command: commander.Command) {
  command
    .command('list')
    .alias('ls')
    .description('List existing generators')
    .arguments('[name]')
    .action((name: string | undefined, args: Command) => listGenerators({
      ...getOptions(args),
      name,
    }));
}
