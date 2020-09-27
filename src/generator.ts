import chalk from 'chalk';
import consola, { LogLevel } from 'consola';
import ejs from 'ejs';
import fs from 'fs-extra';
import json5 from 'json5';
import path from 'path';
import {
  fsExistsAsFile,
  fsListDirectories,
  fsReadFileContent,
  fsWriteFileContent,
  globFiles,
  joinPaths,
} from './file-utils';
import {
  createLogPrefix,
  printDetails,
  printField,
  sprintBad,
  sprintBadList,
  sprintGood,
  sprintGoodList,
  sprintInfo,
  sprintLabel,
} from './logging';
import { defaultModelLoaders } from './model-loaders';
import {
  CommandMode,
  GlobalOptions,
  ICommand,
  ICommandModel,
  IConfiguration,
  IConfigurationFile,
  IGenerator,
  IGeneratorModelFile,
  IModelLoaderConfig,
  InfoOptions,
  InitOptions,
  InitOptionsOnly,
  ListOptions,
  OutputOptionsOnly,
  PrintOptionsOnly,
  SearchOptionsOnly,
  Variables,
} from './types';

const defaultGlobalOptions: Required<GlobalOptions> = {
  configFile: 'pcgen.js',
  logLevel: LogLevel.Info,
  version: '',
};

const defaultOutputOptions: Required<OutputOptionsOnly> = {
  outDir: '.',
  overwrite: false,
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
        chalk`${logPrefix}: ${sprintBad(
          'Configuration file must export a default function to return configuration'
        )}`
      );
    }

    const config = await configModule.default();

    // TODO: Validate configuration with joi library

    return config;
  } catch (error) {
    consola.log(
      chalk`Error trying to load configuration file '${sprintBad(configFile)}'`
    );
    consola.log(error);

    return undefined;
  }
}

const defaultInitOptions: Required<InitOptions> = {
  ...defaultGlobalOptions,
  ...defaultOutputOptions,
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
      chalk`${sprintGood('PCGen configuration file is already initialized')}`
    );
    return;
  }

  consola.log(chalk`Initializing PCGen configuration ...`);

  const sourceFolder = initOptions.initAssets;
  const pcgenPath = initOptions.pcgenFolder;

  // Copy assets/generator folder

  const sourceGenerator = path.join(sourceFolder, 'generator');
  const targetGenerator = path.join(pcgenPath, initOptions.generatorFolder);

  consola.trace(
    chalk`${logPrefix}: copy '${sprintGood(sourceGenerator)}'} to '${sprintGood(
      targetGenerator
    )}'`
  );
  await fs.copy(sourceGenerator, targetGenerator);

  // Copy assets/.gitignore

  const sourceGitIgnore = path.join(sourceFolder, '_gitignore');
  const targetGitIgnore = path.join(pcgenPath, '.gitignore');

  consola.trace(
    chalk`${logPrefix}: copy '${sprintGood(sourceGitIgnore)}' to '${sprintGood(
      targetGitIgnore
    )}'`
  );
  await fs.copy(sourceGitIgnore, targetGitIgnore);

  // Create pcgen.js config file

  const sourceConfigTemplate = path.join(sourceFolder, 'pcgen.js.ejs');
  const targetConfig = path.join(initOptions.configFile);

  consola.trace(chalk`${logPrefix}: generate '${sprintGood(targetConfig)}'`);
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

  consola.log(sprintGood('PCGen configuration initialized!'));
}

export function replaceTextVariables(
  text: string,
  ...variables: Variables[]
): string {
  return text.replace(
    /%([A-Za-z_][A-Za-z_0-9]*)%/,
    (substring: string, varName: string): string => {
      for (const vars of variables) {
        const result = vars[varName];
        if (result) {
          return result;
        }
      }
      return substring;
    }
  );
}

function createModelLoaders(config: IConfigurationFile, variables: Variables) {
  const logPrefix = createLogPrefix('createModelLoaders');

  const byName = new Map<string, IModelLoaderConfig>();
  const byExtension = new Map<string, IModelLoaderConfig>();

  for (const loader of config.modelLoaders ?? []) {
    const extensions = loader.extensions
      ? sprintGoodList(loader.extensions)
      : sprintBad('None');
    consola.trace(
      chalk`${logPrefix}: Module loader '${sprintGood(
        loader.name
      )}' for extensions: ${extensions}`
    );

    if (byName.has(loader.name)) {
      consola.warn(
        chalk`There are multiple model loaders with name '${sprintBad(
          loader.name
        )}'`
      );
    } else {
      byName.set(loader.name, loader);
    }

    for (const extension of loader.extensions ?? []) {
      if (byExtension.has(extension)) {
        consola.warn(
          chalk`There are multiple model loaders with extension '${sprintBad(
            extension
          )}'`
        );
      } else {
        byExtension.set(extension, loader);
      }
    }
  }

  for (const loader of config.useDefaultModelLoaders === false
    ? []
    : defaultModelLoaders) {
    const extensions = loader.extensions
      ? sprintGoodList(loader.extensions)
      : sprintBad('None');
    consola.trace(
      chalk`${logPrefix}: Default module loader '${sprintGood(
        loader.name
      )}' for extensions: ${extensions}`
    );

    if (!byName.has(loader.name)) {
      byName.set(loader.name, loader);
    }

    for (const extension of loader.extensions ?? []) {
      if (!byExtension.has(extension)) {
        byExtension.set(extension, loader);
      }
    }
  }

  const loadModelFromContent = async (
    content: string,
    loaderName: string,
    isOptional?: boolean,
    replaceVariables?: boolean
  ): Promise<any | undefined> => {
    const errorLogger = isOptional === true ? consola.trace : consola.log;

    const loader = byName.get(loaderName);

    if (!loader) {
      errorLogger(
        chalk`There is no model loader register for name '${sprintBad(
          loaderName
        )}'`
      );
      return undefined;
    }

    try {
      if (loader.fromContent) {
        const text = await loader.fromContent(content);
        // Replace variables by default
        if (replaceVariables !== false) {
          return replaceTextVariables(text, variables);
        }

        return text;
      }

      errorLogger(
        chalk`Model loader '${sprintBad(
          loaderName
        )}' cannot load from content. You need to pass the filePath.`
      );
      return undefined;
    } catch (error) {
      consola.error(
        chalk`Error loading model of type '${sprintBad(loaderName)}'`
      );
      consola.trace(error);
    }
  };

  const loadModelFromPath = async (
    filePath: string,
    loaderName?: string,
    isOptional?: boolean,
    replaceVariables?: boolean
  ): Promise<any | undefined> => {
    const errorLogger = isOptional === true ? consola.trace : consola.log;

    const extension = path.extname(filePath);

    const loader = loaderName
      ? byName.get(loaderName)
      : byExtension.get(extension);

    if (!loader) {
      errorLogger(
        chalk`There is no model loader register for name '${sprintBad(
          loaderName
        )}' or extension '${sprintBad(extension)}'`
      );
      return undefined;
    }

    try {
      if (!(await fsExistsAsFile(filePath))) {
        errorLogger(chalk`File '${sprintBad(filePath)}' does not exist`);
        return undefined;
      }

      if (loader.fromPath) {
        return await loader.fromPath(filePath);
      }

      if (loader.fromContent) {
        const content = await fsReadFileContent(filePath);

        if (content === undefined) {
          errorLogger(
            chalk`Cannot read content of model file '${sprintBad(filePath)}'.`
          );
          return undefined;
        }

        if (replaceVariables === true) {
          const text = replaceTextVariables(content, variables);
          return await loader.fromContent(text);
        }

        return await loader.fromContent(content);
      }

      errorLogger(
        chalk`Model loader '${sprintBad(
          loader.name
        )}' does not define any load function.`
      );
      return undefined;
    } catch (error) {
      consola.error(
        chalk`Error loading model of type '${sprintBad(loader.name)}'`
      );
      consola.trace(error);
    }
  };

  return {
    loadModelFromContent,
    loadModelFromPath,
  };
}

function createConfigVariables(config: Required<InitOptionsOnly>) {
  return {
    PCGEN_FOLDER: config.pcgenFolder,
    GENERATOR_FOLDER: config.generatorFolder,
    COMMANDS_FOLDER: config.commandsFolder,
    TEMPLATES_FOLDER: config.templatesFolder,
    DEFAULT_COMMAND: config.defaultCommand,
    CWD: config.cwd,
    INIT_ASSETS: config.initAssets,
    OUT_DIR: config.outDir,
  };
}

function createConfiguration(config: IConfigurationFile): IConfiguration {
  const requiredConfig: Required<InitOptionsOnly> = {
    ...defaultInitOptions,
    ...config,
  };

  const atCWD = (...paths: string[]): string => {
    return path.normalize(joinPaths(requiredConfig.cwd, ...paths));
  };

  const atBasePath = (...paths: string[]): string => {
    return path.normalize(joinPaths(process.cwd(), ...paths));
  };

  const atOutDir = (...paths: string[]): string =>
    atCWD(requiredConfig.outDir, ...paths);

  const variables: Variables = {
    ...process.env,
    ...createConfigVariables(requiredConfig),
  };

  const modelLoaders = createModelLoaders(config, variables);

  return {
    ...requiredConfig,
    variables,
    atCWD,
    atBasePath,
    atOutDir,
    ...modelLoaders,
  };
}

const defaultPrintListOptions: Required<PrintOptionsOnly> = {
  showBasePath: false,
  showSummary: false,
  showCommands: false,
  showDetails: false,
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

async function loadGeneratorModelFile(
  name: string,
  basePath: string,
  configuration: IConfiguration
) {
  const files = await globFiles(basePath, `${name}.*`);

  if (files.length === 0) {
    consola.trace(
      chalk`Generator '${sprintLabel(name)}' at '${sprintLabel(
        basePath
      )}' does not have an explicit model '${sprintLabel(name)}.*'`
    );
    return undefined;
  }

  if (files.length > 1) {
    const found = sprintBadList(files);
    consola.info(
      chalk`Generator '${sprintLabel(name)}' at '${sprintLabel(
        basePath
      )}' have multiple explicit models: ${found}`
    );
    return undefined;
  }

  const model: IGeneratorModelFile = await configuration.loadModelFromPath(
    files[0],
    undefined,
    true,
    true
  );

  // TODO: Validate model

  return model;
}

async function loadCommand(
  commandModel: ICommandModel,
  defaultCommandMode: CommandMode
): Promise<ICommand | undefined> {
  const commandMode: CommandMode =
    commandModel.js ? 'js' :
    commandModel.folder ? 'folder' :
    defaultCommandMode

  return {
    name: commandModel.name,
    caption: commandModel.caption,
    summary: commandModel.summary,
    details: commandModel.details,
    commandMode,
  }
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

  let modelFile = await loadGeneratorModelFile(name, basePath, configuration);
  // const isConventionBased = !generatorModelFile
  // console.log('generatorModelFile', generatorModelFile);
  if (modelFile === undefined) {
    // TODO: Implement convention based generator
    consola.log(
      chalk`Could not load generator '${sprintBad(name)}' at '${sprintBad(
        basePath
      )}'`
    );
    return undefined;
  } else {
    // TODO: Validate model is fine
    const defaultCommandMode: CommandMode =
      modelFile.defaultCommandMode === 'js'
        ? 'js'
        : modelFile.defaultCommandMode === 'folder'
        ? 'folder'
        : 'js';

    const commands = await Promise.all(
      modelFile.commands.map((c) => loadCommand(c, defaultCommandMode))
    );

    if (commands.some((c) => !c)) {
      const badCommands = sprintBadList(
        modelFile.commands
          .map((cm, i) => (!commands[i] ? cm.name : undefined))
          .filter((n) => !!n)
      );
      consola.log(
        chalk`Could not load some commands of generator '${sprintLabel(
          name
        )}' at '${sprintLabel(basePath)}': ${badCommands}`
      );
      return undefined;
    }

    const generator: IGenerator = {
      name,
      basePath,
      configuration,
      commands: commands as ICommand[],

      defaultCommand: modelFile.defaultCommand ?? modelFile.commands[0].name,
      defaultCommandMode,
      caption: modelFile.caption,
      summary: modelFile.summary,
      details: modelFile.details,
      tags: modelFile.tags ?? [],
      defaultEngine: modelFile.defaultEngine,
      defaultEngineOptions: modelFile.defaultEngineOptions,
    };

    // consola.log('generator', generator)

    return generator;
  }
}

async function searchGenerators(
  configuration: IConfiguration,
  listOptions: Required<SearchOptionsOnly>,
  top?: number
): Promise<IGenerator[]> {
  const generators: IGenerator[] = [];

  for (const searchPath of [
    configuration.pcgenFolder,
    ...configuration.searchPaths,
  ]) {
    for (const directory of await fsListDirectories(searchPath)) {
      if (
        !listOptions.name ||
        directory.toLowerCase().indexOf(listOptions.name.toLowerCase()) >= 0
      ) {
        const generator = await loadGenerator(
          directory,
          joinPaths(searchPath, directory),
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
  if (generator.caption) {
    consola.log(chalk`- ${sprintGood(generator.name)}: ${sprintLabel(generator.caption)}`);
  } else {
    consola.log(chalk`- ${sprintGood(generator.name)}`);
  }

  if (printOptions.showSummary && generator.summary) {
    consola.log(`    ${sprintInfo(generator.summary)}`);
  }

  if (printOptions.showBasePath) {
    printField('Base Path', generator.basePath);
  }

  if (printOptions.showDetails) {
    printDetails(generator.details, '');
  }

  if (printOptions.showCommands) {
    printField('Commands', '');
    for (const command of generator.commands) {
      if (command.caption) {
        consola.log(chalk`    - ${sprintGood(command.name)}: ${sprintLabel(command.caption)}`);
      } else {
        consola.log(chalk`    - ${sprintGood(command.name)}`);
      }

      if (printOptions.showSummary && command.summary) {
        consola.log(`        ${sprintInfo(command.summary)}`);
      }

      if (printOptions.showDetails) {
        printDetails(command.details, '    ');
      }
    }
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
      chalk`PCGen is not initialized in current folder. Run command ${sprintGood(
        'pcgen init'
      )} to start using pcgen`
    );
    return;
  }

  const configuration = createConfiguration(config);

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
  showCommands: true,
  showDetails: true,
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
      chalk`PCGen is not initialized in current folder. Run command ${sprintGood(
        'pcgen init'
      )} to start using pcgen`
    );
    return;
  }

  const configuration = createConfiguration(config);

  const generators = await searchGenerators(configuration, infoOptions);

  if (generators.length === 0) {
    consola.log(chalk`There are no generators to show with given criteria.`);
    return;
  }

  if (generators.length > 1) {
    consola.log(
      chalk`{yellow There are multiple generators with given criteria}`
    );
  }

  for (const generator of generators) {
    await printGenerator(generator, infoOptions);
  }
}
