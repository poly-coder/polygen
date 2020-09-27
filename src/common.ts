import commander from 'commander';
import { GlobalOptions, PrintOptionsOnly, SearchOptionsOnly } from './types';

export function getOptions<T extends GlobalOptions>(args: any): T {
  const parentOpts = args.parent ? getOptions(args.parent) : {};

  return {
    ...parentOpts,
    ...args.opts(),
  };
}

export function addSearchOptions(command: commander.Command, _options: SearchOptionsOnly) {
  return command
    .option('-n, --name <generator>', 'Generator name or a part of it to search for');
}

export function addPrintOptions(command: commander.Command, options: PrintOptionsOnly) {
  return command
    .option('-p, --show-path', 'Show generator path', options.showBasePath)
    .option('-s, --show-summary', 'Show generator and commands summary', options.showSummary);
}
