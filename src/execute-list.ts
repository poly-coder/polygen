import consola from 'consola';
import {
  applyGlobalOptions,
  createConfiguration,
  loadConfigurationFile,
} from './configuration';
import { requiredListOptions } from './defaults';
import { createLogPrefix, sprintGood } from './logging';
import { printGenerator } from './printing';
import { searchGenerators } from './searching';
import { IConfiguration, ListOptions, RequiredListOptions } from './types';

async function executeListGenerators(
  listOptions: RequiredListOptions,
  configuration: IConfiguration
) {
  const generators = await searchGenerators(configuration, listOptions);

  if (generators.length === 0) {
    consola.log(`There are no generators to show with given criteria.`);
    return;
  }

  for (const generator of generators) {
    await printGenerator(generator, listOptions);
  }
}

export async function listGenerators(options: ListOptions) {
  const listOptions = requiredListOptions(options);

  if (listOptions.showOptions) {
    consola.log('List Options: ', listOptions);
  }

  applyGlobalOptions(listOptions);

  const logPrefix = createLogPrefix('listGenerators');

  consola.trace(`${logPrefix}: [Start]`);

  const config = await loadConfigurationFile(listOptions.configFile);

  if (!config) {
    consola.log(
      `PCGen is not initialized in current folder. Run command ${sprintGood(
        'pcgen init'
      )} to start using pcgen`
    );
    return;
  }

  const configuration = createConfiguration(config);

  await executeListGenerators(listOptions, configuration);
}
