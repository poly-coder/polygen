import consola from 'consola';
import path from 'path';
import { defaultInitOptions, defaultOutputOptions } from './defaults';
import { fsExistsAsFile, globFiles, joinPaths } from './file-utils';
import { createLogPrefix, sprintBad, sprintBadList, sprintLabel } from './logging';
import { createModelLoaders } from './model-loaders';
import {
  CommandMode,
  ICommand,
  ICommandModel,
  IConfiguration,
  IConfigurationFile,
  IGenerator,
  IGeneratorModelFile,
  RequiredGlobalOptionsOnly,
  RequiredInitOptionsOnly,
  RequiredOutputOptionsOnly,
  Variables,
} from './types';

export function applyGlobalOptions(options: RequiredGlobalOptionsOnly) {
  consola.level = options.logLevel;
}

export async function loadConfigurationFile(
  configFile: string
): Promise<IConfigurationFile | undefined> {
  const logPrefix = createLogPrefix('loadConfigurationFile');

  consola.trace(`${logPrefix}: [Start]`);

  consola.trace(`${logPrefix}: configFile='${configFile}'`);

  const fileName = path.normalize(path.resolve(joinPaths('.', configFile)));

  consola.trace(`${logPrefix}: fileName='${fileName}'`);

  try {
    if (!(await fsExistsAsFile(fileName))) {
      consola.trace(`${logPrefix}: Config file not found`);
      return undefined;
    }

    consola.trace(`${logPrefix}: Loading module`);

    const configModule = await import(fileName);

    consola.trace(`${logPrefix}: Module loaded`);

    if (typeof configModule?.default !== 'function') {
      consola.log(
        `${logPrefix}: ${sprintBad(
          'Configuration file must export a default function to return configuration'
        )}`
      );
    }

    const config = await configModule.default();

    // TODO: Validate configuration with joi library

    return config;
  } catch (error) {
    consola.log(
      `Error trying to load configuration file '${sprintBad(configFile)}'`
    );
    consola.log(error);

    return undefined;
  }
}

function createConfigVariables(
  config: RequiredInitOptionsOnly & RequiredOutputOptionsOnly
) {
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

export function createConfiguration(
  config: IConfigurationFile
): IConfiguration {
  const requiredConfig: RequiredInitOptionsOnly & RequiredOutputOptionsOnly = {
    ...defaultInitOptions,
    ...defaultOutputOptions,
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

export async function loadGeneratorModelFile(
  name: string,
  basePath: string,
  configuration: IConfiguration
) {
  const files = await globFiles(basePath, `${name}.*`);

  if (files.length === 0) {
    consola.trace(
      `Generator '${sprintLabel(name)}' at '${sprintLabel(
        basePath
      )}' does not have an explicit model '${sprintLabel(name)}.*'`
    );
    return undefined;
  }

  if (files.length > 1) {
    const found = sprintBadList(files);
    consola.info(
      `Generator '${sprintLabel(name)}' at '${sprintLabel(
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

export async function loadCommand(
  commandModel: ICommandModel,
  defaultCommandMode: CommandMode
): Promise<ICommand | undefined> {
  const commandMode: CommandMode = commandModel.js
    ? 'js'
    : commandModel.folder
    ? 'folder'
    : defaultCommandMode;

  return {
    name: commandModel.name,
    caption: commandModel.caption,
    summary: commandModel.summary,
    details: commandModel.details,
    commandMode,
  };
}

export async function loadGenerator(
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
      `Could not load generator '${sprintBad(name)}' at '${sprintBad(
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
        `Could not load some commands of generator '${sprintLabel(
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
