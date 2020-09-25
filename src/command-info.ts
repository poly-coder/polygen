import chalk from 'chalk';
import commander from 'commander';
import { Consola } from 'consola';
import { getOptions, PCGenProgramOptions } from './common';
import { getConsola, printDetails, printField } from './logging';
import { createGeneratorsSystem } from './gen-system';
import { readGeneratorSystemConfig } from './gen-configuration';
import { GeneratorDescriptor, GlobalOptions } from './gen-types';

export interface InfoCommandOptions extends PCGenProgramOptions, GlobalOptions {
  readonly generatorName: string;
}

export function infoCommand(command: commander.Command) {
  command
    .command('info')
    .alias('i')
    .description('Show detailed information of a generator')
    .arguments('<generator>')
    .action((generator: string, args) =>
      executeInfoCommand({
        ...getOptions(args),
        generatorName: generator,
      })
    );
}

async function executeInfoCommand(opts: InfoCommandOptions) {
  const console = getConsola(opts);
  const config = await readGeneratorSystemConfig(opts, console);
  const genSystem = createGeneratorsSystem(config, console);

  if (!(await genSystem.ensureInitialized())) {
    return;
  }

  var info = await genSystem.getGeneratorDescriptor(opts.generatorName);

  if (info) {
    printGenerator(info, console);
  } else {
    console.warn(
      `Generator project "${chalk.redBright(
        opts.generatorName
      )}" does not exists. Use '${chalk.greenBright(
        `pcgen new generator ${opts.generatorName}`
      )}' to create it `
    );
  }
}

export function printGenerator(info: GeneratorDescriptor, console: Consola) {
  console.log(`- ${chalk.greenBright(info.name)}`);

  printField('Engine', info.engine?.name);
  printField('Output Directory', info.data.outDir);
  printDetails(info.data.details);

  if (info.commands) {
    if (info.commands.length > 0) {
      printField('Commands', '');
      for (const command of info.commands) {
        console.log(`    > ${chalk.cyanBright(command.data.name)}`);
        printField('Code File', command.data.js, '    ');
        printDetails(command.data.details, '    ');
      }
    } else {
      printField('Commands', 'none');
    }
  }
}
