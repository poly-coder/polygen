import consola from 'consola';
import ejs from 'ejs';
import fs from 'fs-extra';
import json5 from 'json5';
import path from 'path';
import {
  applyGlobalOptions,
  createConfiguration,
  loadConfigurationFile,
} from './configuration';
import {
  requiredInfoOptions,
  requiredInitOptions,
  requiredListOptions,
  requiredRunOptions,
} from './defaults';
import { fsWriteFileContent } from './file-utils';
import { createLogPrefix, sprintGood, sprintWarn } from './logging';
import { printGenerator } from './printing';
import { searchGenerators } from './searching';
import {
  IConfiguration,
  IGenerator,
  InfoOptions,
  InitOptions,
  ListOptions,
  RequiredInfoOptions,
  RequiredInitOptions,
  RequiredListOptions,
  RequiredRunOptions,
  RunOptions,
} from './types';

async function executeInitialize(
  initOptions: RequiredInitOptions,
  logPrefix: string
) {
  const sourceFolder = initOptions.initAssets;
  const pcgenPath = initOptions.pcgenFolder;

  // Copy assets/generator folder

  const sourceGenerator = path.join(sourceFolder, 'generator');
  const targetGenerator = path.join(pcgenPath, initOptions.generatorFolder);

  consola.trace(
    `${logPrefix}: copy '${sprintGood(sourceGenerator)}'} to '${sprintGood(
      targetGenerator
    )}'`
  );
  await fs.copy(sourceGenerator, targetGenerator);

  // Copy assets/.gitignore

  const sourceGitIgnore = path.join(sourceFolder, '_gitignore');
  const targetGitIgnore = path.join(pcgenPath, '.gitignore');

  consola.trace(
    `${logPrefix}: copy '${sprintGood(sourceGitIgnore)}' to '${sprintGood(
      targetGitIgnore
    )}'`
  );
  await fs.copy(sourceGitIgnore, targetGitIgnore);

  // Create pcgen.js config file

  const sourceConfigTemplate = path.join(sourceFolder, 'pcgen.js.ejs');
  const targetConfig = path.join(initOptions.configFile);

  consola.trace(`${logPrefix}: generate '${sprintGood(targetConfig)}'`);
  const configContent = await ejs.renderFile(sourceConfigTemplate, {
    json5: json5,
    config: {
      cwd: initOptions.cwd,
      outDir: initOptions.outDir,
      generatorFolder: initOptions.generatorFolder,
      commandsFolder: initOptions.commandsFolder,
      templatesFolder: initOptions.templatesFolder,
      defaultCommand: initOptions.defaultCommand,
      initAssets: initOptions.initAssets,
      pcgenFolder: initOptions.pcgenFolder,
      searchPaths: initOptions.searchPaths,
    },
  });

  await fsWriteFileContent(targetConfig, configContent);
}

export async function initialize(options: InitOptions) {
  const initOptions = requiredInitOptions(options);

  if (initOptions.showOptions) {
    consola.log('Initialize Options: ', initOptions);
  }

  applyGlobalOptions(initOptions);

  const logPrefix = createLogPrefix('initialize');

  consola.trace(`${logPrefix}: [Start]`);

  const config = await loadConfigurationFile(initOptions.configFile);

  if (config) {
    consola.log(
      `${sprintGood('PCGen configuration file is already initialized')}`
    );
    return;
  }

  consola.log(`Initializing PCGen configuration ...`);

  await executeInitialize(initOptions, logPrefix);

  consola.log(sprintGood('PCGen configuration initialized!'));
}

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

async function executeRunGenerator(
  _runOptions: RequiredRunOptions,
  _generator: IGenerator) {
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

  await executeRunGenerator(runOptions, generators[0])
}
