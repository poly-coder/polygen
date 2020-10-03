import consola from 'consola';
import {
  applyGlobalOptions,
  createConfiguration,
  loadConfigurationFile,
} from './configuration';
import { requiredInfoOptions } from './defaults';
import { createLogPrefix, sprintGood, sprintWarn } from './logging';
import { printGenerator } from './printing';
import { searchGenerators } from './searching';
import { IConfiguration, InfoOptions, RequiredInfoOptions } from './types';

async function executeShowGeneratorInfo(
  infoOptions: RequiredInfoOptions,
  configuration: IConfiguration
) {
  const generators = await searchGenerators(configuration, infoOptions);

  if (generators.length === 0) {
    consola.log(`There are no generators to show with given criteria.`);
    return;
  }

  if (generators.length > 1) {
    consola.log(
      sprintWarn('There are multiple generators with given criteria')
    );
  }

  for (const generator of generators) {
    await printGenerator(generator, infoOptions);
  }
}

export async function showGeneratorInfo(options: InfoOptions) {
  const infoOptions = requiredInfoOptions(options);

  if (infoOptions.showOptions) {
    consola.log('Information Options: ', infoOptions);
  }

  applyGlobalOptions(infoOptions);

  const logPrefix = createLogPrefix('showGeneratorInfo');

  consola.trace(`${logPrefix}: [Start]`);

  const config = await loadConfigurationFile(infoOptions.configFile);

  if (!config) {
    consola.log(
      `PCGen is not initialized in current folder. Run command ${sprintGood(
        'pcgen init'
      )} to start using pcgen`
    );
    return;
  }

  const configuration = createConfiguration(config);

  await executeShowGeneratorInfo(infoOptions, configuration);
}
