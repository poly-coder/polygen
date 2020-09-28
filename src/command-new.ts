import commander, { Command } from 'commander';
import { addOutputOptions, addSearchOptions, getOptions } from './options';
import { runGenerator } from './generator';

export function newCommand(command: commander.Command) {
  command = command
    .command('new')
    .alias('n')
    .description('Execute a generator');

  command = addSearchOptions(command, {});

  command = addOutputOptions(command, {});

  command = command
    .option(
      '-s, --step-tag <tags...>',
      'Step tags to run. Use simple "tag1" "tag2" to run all steps that have any of them. Use "!tag" to exclude steps with given tag. Use "*tag" to require the prescense of given tag'
    )
    .option(
      '-m, --model <file>',
      'File containing model data. This is a json/yaml/xml/toml/js file containing input model'
    )
    .option('-f, --model-format <format>', 'Indicates the model format')
    .option(
      '-j, --json-path <path>',
      'JsonPath expression to access a submodel from the given model'
    )
    .option(
      '-d, --dry-run',
      'Dry run. Do not generate side effects. Only print messages as if code would have been actually generated',
      false
    )
    .option(
      '--phases <phase>',
      'Last phase to run: none, validate, pregenerate, generate, postgenerate or all. Not implemented yet!',
      'all'
    )
    .option(
      '--stdout',
      'Print generated content to stdout. Unless option --dry-run is specified, the content is ALSO WRITTEN to files'
    )
    .arguments('<name>')
    .action((name: string | undefined, args: Command) =>
      runGenerator({
        ...getOptions(args),
        name,
      })
    );

  return command;
}
