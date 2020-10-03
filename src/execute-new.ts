import consola from 'consola';
import {
  applyGlobalOptions,
  createConfiguration,
  loadConfigurationFile,
} from './configuration';
import { requiredRunOptions } from './defaults';
import { createLogPrefix, sprintGood } from './logging';
import { searchGenerators } from './searching';
import {
  IGenerator,
  RequiredRunOptions,
  RunOptions,
} from './types';

async function executeRunGenerator(
  _runOptions: RequiredRunOptions,
  _generator: IGenerator
) {
  
}

export async function runGenerator(options: RunOptions) {
  const runOptions = requiredRunOptions(options);

  if (runOptions.showOptions) {
    consola.log('Run Options: ', runOptions);
  }

  applyGlobalOptions(runOptions);

  const logPrefix = createLogPrefix('runGenerator');

  consola.trace(`${logPrefix}: [Start]`);

  const config = await loadConfigurationFile(runOptions.configFile);

  if (!config) {
    consola.log(
      `PCGen is not initialized in current folder. Run command ${sprintGood(
        'pcgen init'
      )} to start using pcgen`
    );
    return;
  }

  const configuration = createConfiguration(config);

  const generators = await searchGenerators(configuration, runOptions);

  if (generators.length === 0) {
    consola.log(`There are no generators to show with given criteria.`);
    return;
  }

  if (generators.length > 1) {
    consola.log(`{yellow There are multiple generators with given criteria}`);
  }

  await executeRunGenerator(runOptions, generators[0]);
}
