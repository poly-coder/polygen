import commander from 'commander';
import { LogLevel } from 'consola';
import { parseLogLevel } from './logging';
import {
  GlobalOptions,
  OutputOptionsOnly,
  PrintOptionsOnly,
  SearchOptionsOnly,
} from './types';

export function getOptions<T extends GlobalOptions>(args: any): T {
  const parentOpts = args.parent ? getOptions(args.parent) : {};

  return {
    ...parentOpts,
    ...args.opts(),
  };
}

export function addGlobalOptions(command: commander.Command) {
  return command
    .option(
      '--config-file <file.js>',
      'Configuration file name for pcgen. Defaults to ".pcgen.json"'
    )
    .option(
      '-l, --log-level <level>',
      'Log level. Any of: fatal or f, error or e, warning or warn or w, log or l, information or info or i, success or s, debug or d, trace or t, silent or verbose or v',
      parseLogLevel,
      LogLevel.Info
    );
}

export function addSearchOptions(
  command: commander.Command,
  _options: SearchOptionsOnly
) {
  return command;
}

export function addPrintOptions(
  command: commander.Command,
  options: PrintOptionsOnly
) {
  return command
    .option('-p, --show-path', 'Show generator path', options.showBasePath)
    .option(
      '-s, --show-summary',
      'Show generator and commands summary',
      options.showSummary
    )
    .option(
      '-d, --show-details',
      'Show generator and commands details',
      options.showDetails
    )
    .option(
      '-c, --show-commands',
      "Show generator's command list",
      options.showCommands
    );
}

export function addOutputOptions(
  command: commander.Command,
  options?: OutputOptionsOnly
) {
  return command
    .option(
      '--out-dir <directory>',
      'Output directory where to put generated files. Try "src", "src/generated", etc. By default is current directory. If relative, it is based on CWD',
      options?.outDir
    )
    .option(
      '-w, --overwrite',
      'Overwrite all generated files without asking.',
      options?.overwrite
    )
    .option(
      '--no-overwrite',
      'Never overwrite an existing file with a generated one. It does not prevent snippet insertions thou'
    );
}
