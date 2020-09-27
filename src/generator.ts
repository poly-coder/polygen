import chalk from 'chalk';
import consola, { LogLevel } from 'consola';
import ejs from 'ejs';
import fs from 'fs-extra';
import json5 from 'json5';
import path from 'path';
import {
  fsExistsAsFile,
  fsListDirectories,
  fsWriteFileContent,
  joinPaths,
} from './file-utils';
import { createLogPrefix, printField } from './logging';
import {
  GlobalOptions,
  IConfiguration,
  IConfigurationFile,
  IGenerator,
  InfoOptions,
  InitOptions,
  ListOptions,
  PrintOptionsOnly,
  SearchOptionsOnly,
} from './types';

const defaultGlobalOptions: Required<GlobalOptions> = {
  configFile: 'pcgen.js',
  logLevel: LogLevel.Info,
  version: '',
};

const defaultSearchOptions: Required<SearchOptionsOnly> = {
  name: '',
};

function applyGlobalOptions(options: GlobalOptions) {
  consola.level = options.logLevel;
}

export async function loadConfigurationFile(
  configFile: string
): Promise<IConfigurationFile | undefined> {
  const logPrefix = createLogPrefix('loadConfigurationFile');

  consola.trace(chalk`${logPrefix}: [Start]`);

  consola.trace(chalk`${logPrefix}: configFile='${configFile}'`);

  const fileName = path.normalize(path.resolve(joinPaths('.', configFile)));

  consola.trace(chalk`${logPrefix}: fileName='${fileName}'`);

  try {
    if (!(await fsExistsAsFile(fileName))) {
      consola.trace(`${logPrefix}: Config file not found`);
      return undefined;
    }

    consola.trace(chalk`${logPrefix}: Loading module`);

    const configModule = await import(fileName);

    consola.trace(chalk`${logPrefix}: Module loaded`);

    if (typeof configModule?.default !== 'function') {
      consola.log(
        chalk`${logPrefix}: {red ${'Configuration file must export a default function to return configuration'}}`
      );
    }

    const config = await configModule.default();

    // TODO: Validate configuration with joi library

    return config;
  } catch (error) {
    consola.log(
      chalk`Error trying to load configuration file {red '${configFile}'}`
    );
    consola.log(error);

    return undefined;
  }
}

const defaultInitOptions: Required<InitOptions> = {
  ...defaultGlobalOptions,
  cwd: '.',
  outDir: '.',
  generatorFolder: 'generator',
  commandsFolder: 'commands',
  templatesFolder: 'templates',
  defaultCommand: 'new',
  initAssets: path.normalize(
    path.relative('.', path.join(__dirname, '../assets'))
  ),
  pcgenFolder: '_pcgen',
  searchPaths: [],
};

function requiredInitOptions(options?: InitOptions): Required<InitOptions> {
  return {
    ...defaultInitOptions,
    ...options,
  };
}

export async function initialize(options: InitOptions) {
  const initOptions = requiredInitOptions(options);

  applyGlobalOptions(initOptions);

  const logPrefix = createLogPrefix('initialize');

  consola.trace(chalk`${logPrefix}: [Start]`);

  const config = await loadConfigurationFile(initOptions.configFile);

  if (config) {
    consola.log(
      chalk`{green ${'PCGen configuration file is already initialized'}}`
    );
  } else {
    consola.log(chalk`Initializing PCGen configuration ...`);

    const sourceFolder = initOptions.initAssets;
    const pcgenPath = initOptions.pcgenFolder;

    // Copy assets/generator folder

    const sourceGenerator = path.join(sourceFolder, 'generator');
    const targetGenerator = path.join(pcgenPath, initOptions.generatorFolder);

    consola.trace(
      chalk`${logPrefix}: copy {green '${sourceGenerator}'} to {green '${targetGenerator}'}`
    );
    await fs.copy(sourceGenerator, targetGenerator);

    // Copy assets/.gitignore

    const sourceGitIgnore = path.join(sourceFolder, '_gitignore');
    const targetGitIgnore = path.join(pcgenPath, '.gitignore');

    consola.trace(
      chalk`${logPrefix}: copy {green '${sourceGitIgnore}'} to {green '${targetGitIgnore}'}`
    );
    await fs.copy(sourceGitIgnore, targetGitIgnore);

    // Create pcgen.js config file

    const sourceConfigTemplate = path.join(sourceFolder, 'pcgen.js.ejs');
    const targetConfig = path.join(initOptions.configFile);

    consola.trace(chalk`${logPrefix}: generate {green '${targetConfig}'}`);
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

    consola.log(chalk`{green ${'PCGen configuration initialized!'}}`);
  }
}

function requiredConfig(config: IConfigurationFile): IConfiguration {
  const requiredConfig: Required<IConfigurationFile> = {
    ...defaultInitOptions,
    ...config,
  };

  return {
    ...requiredConfig,
  };
}

const defaultPrintListOptions: Required<PrintOptionsOnly> = {
  showBasePath: false,
  showSummary: false,
};

const defaultListOptions: Required<ListOptions> = {
  ...defaultGlobalOptions,
  ...defaultPrintListOptions,
  name: '',
};

function requiredListOptions(options?: ListOptions): Required<ListOptions> {
  return {
    ...defaultListOptions,
    ...options,
  };
}

async function loadGenerator(
  name: string,
  basePath: string,
  configuration: IConfiguration
): Promise<IGenerator | undefined> {
  /**
   *
   * /<generator>
   *   - <generator>.js/json/yaml model
   *   / commands
   *     - new.js
   *   / templates
   *     - main.ejs
   *
   * --------------
   *
   * /<generator>
   *   / new
   *     - main.ejs.t // Contains front matter to describe other features
   *
   */

  return {
    name,
    basePath,
    configuration,
  };
}

async function searchGenerators(
  configuration: IConfiguration,
  listOptions: Required<SearchOptionsOnly>,
  top?: number
): Promise<IGenerator[]> {
  const generators: IGenerator[] = [];

  for (const searchPath of ['.', ...configuration.searchPaths]) {
    const pcgenFolder = joinPaths(searchPath, configuration.pcgenFolder);
    for (const directory of await fsListDirectories(pcgenFolder)) {
      if (
        !listOptions.name ||
        directory.toLowerCase().indexOf(listOptions.name.toLowerCase()) >= 0
      ) {
        const generator = await loadGenerator(
          directory,
          joinPaths(pcgenFolder, directory),
          configuration
        );

        if (generator) {
          generators.push(generator);

          if (top !== undefined && generators.length >= top) {
            break;
          }
        }
      }
    }
  }

  return generators;
}

async function printGenerator(
  generator: IGenerator,
  printOptions: Required<PrintOptionsOnly>
) {
  consola.log(chalk`- {green ${generator.name}}`);

  if (printOptions.showBasePath) {
    printField('Base Path', generator.basePath);
  }
}

export async function listGenerators(options: ListOptions) {
  const listOptions = requiredListOptions(options);

  applyGlobalOptions(listOptions);

  const logPrefix = createLogPrefix('listGenerators');

  consola.trace(chalk`${logPrefix}: [Start]`);

  const config = await loadConfigurationFile(listOptions.configFile);

  if (!config) {
    consola.log(
      chalk`PCGen is not initialized in current folder. Run command {green pcgen init} to start using pcgen`
    );
    return;
  }

  const configuration = requiredConfig(config);

  const generators = await searchGenerators(configuration, listOptions);

  if (generators.length === 0) {
    consola.log(chalk`There are no generators to show with given criteria.`);
    return;
  }

  for (const generator of generators) {
    await printGenerator(generator, listOptions);
  }
}

const defaultPrintInfoOptions: Required<PrintOptionsOnly> = {
  showBasePath: true,
  showSummary: true,
};

const defaultInfoOptions: Required<InfoOptions> = {
  ...defaultGlobalOptions,
  ...defaultSearchOptions,
  ...defaultPrintInfoOptions,
};

function requiredInfoOptions(options?: InfoOptions): Required<InfoOptions> {
  return {
    ...defaultInfoOptions,
    ...options,
  };
}

export async function showGeneratorInfo(options: InfoOptions) {
  const infoOptions = requiredInfoOptions(options);

  applyGlobalOptions(infoOptions);

  const logPrefix = createLogPrefix('showGeneratorInfo');

  consola.trace(chalk`${logPrefix}: [Start]`);

  const config = await loadConfigurationFile(infoOptions.configFile);

  if (!config) {
    consola.log(
      chalk`PCGen is not initialized in current folder. Run command {green pcgen init} to start using pcgen`
    );
    return;
  }

  const configuration = requiredConfig(config);

  const generators = await searchGenerators(configuration, infoOptions);

  if (generators.length === 0) {
    consola.log(chalk`There are no generators to show with given criteria.`);
    return;
  }

  if (generators.length > 1) {
    consola.log(chalk`There are multiple generators with given criteria'`);
  }

  for (const generator of generators) {
    await printGenerator(generator, infoOptions);
  }
}
