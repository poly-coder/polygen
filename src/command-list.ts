import commander, { Command } from 'commander';
// import { printGeneratorInfo } from "./command-info";
import { getOptions, PCGenProgramOptions } from './common';
import { getConsola } from './logging';
import { createGeneratorsSystem } from './gen-system';
import { readGeneratorSystemConfig } from './gen-configuration';
import { ListGeneratorsOptions } from './gen-types';
import chalk from 'chalk';

export interface ListCommandOptions
  extends PCGenProgramOptions,
    ListGeneratorsOptions {}

export function listCommand(command: commander.Command) {
  command
    .command('list')
    .alias('ls')
    .description('List existing generators and commands')
    .arguments('[name]')
    .action((name: string, args: Command) =>
      executeListCommand({
        ...getOptions(args),
        name,
      })
    );
}

async function executeListCommand(opts: ListCommandOptions) {
  const console = getConsola(opts);
  const config = await readGeneratorSystemConfig(opts, console);
  const genSystem = createGeneratorsSystem(config, console);

  if (!(await genSystem.ensureInitialized())) {
    return;
  }

  var generators = await genSystem.listGenerators(opts);

  if (generators?.length > 0) {
    for (const generator of generators) {
      console.info(`- ${chalk.greenBright(generator)}`);
    }
  } else {
    console.info(`No generators found`);
  }
}
