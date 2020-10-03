import commander from 'commander';
import { addOutputOptions, getOptions } from './options';
import { initialize } from './execute-initialize';

export function initCommand(command: commander.Command) {
  command = command
    .command('init')
    .alias('initialize')
    .description('Creates a new generator')
    .option(
      '--search-paths <...paths>',
      'Paths where to locate generators, separated by semicolon'
    )
    .option(
      '--pcgen-folder',
      'pcgen folder where generators are located, relative to base path'
    )
    .option(
      '--commands-folder',
      'Commands folder where commands are located, relative to generator folder'
    )
    .option(
      '--templates-folder',
      'Templates folder where templates are located, relative to generator folder'
    )
    .option(
      '--default-command',
      'Default command used when a generator is executed'
    )
    .option(
      '--cwd',
      'Current working directory where new files are generated relative to it'
    )
    .option(
      '--init-assets',
      'Folder containing initial generator assets to copy to local _pcgen folder'
    );

  command = addOutputOptions(command);

  command.action((args) => initialize(getOptions(args)));

  return command
}
