import commander from 'commander';
import { getOptions } from './common';
import { initialize } from './generator';

export function initCommand(command: commander.Command) {
  command
    .command('init')
    .alias('initialize')
    .description('Creates a new generator')
    .option(
      '-s, --search-paths <...paths>',
      'Paths where to locate generators, separated by semicolon'
    )
    .option(
      '-b, --base-path',
      'Paths where to locate local generators and create new ones. Created with pcgen init'
    )
    .option(
      '-p, --pcgen-folder',
      'pcgen folder where generators are located, relative to base path'
    )
    .option(
      '-c, --commands-folder',
      'Commands folder where commands are located, relative to generator folder'
    )
    .option(
      '-t, --templates-folder',
      'Templates folder where templates are located, relative to generator folder'
    )
    .option(
      '-d, --default-command',
      'Default command used when a generator is executed'
    )
    .option(
      '--cwd',
      'Current working directory where new files are generated relative to it'
    )
    .option(
      '--init-assets',
      'Folder containing initial generator assets to copy to local _pcgen folder'
    )
    .option(
      '--out-dir',
      'Output directory where to put generated files. Try "src", "src/generated", etc. By default is current directory. If relative, it is based on CWD'
    )
    .action((args) => initialize(getOptions(args)));
}
