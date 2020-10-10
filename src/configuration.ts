import consola from 'consola';
import path from 'path';
import { defaultInitOptions, defaultOutputOptions } from './defaults';
import { fsExistsAsFile, globFiles, joinPaths } from './file-utils';
import {
  createLogPrefix,
  sprintBad,
  sprintBadList,
  sprintGoodList,
  sprintLabel,
} from './logging';
import { createFallbackModelLoader, createModelLoaders } from './model-loaders';
import { createFallbackModelValidator, createModelValidators } from './model-validators';
import { createFallbackTemplateHelpers, createTemplateHelpers } from './template-helpers';
import { createFallbackTemplateRunners, createTemplateRunners } from './template-runners';
import {
  CommandMode,
  ICommand,
  ICommandContext,
  ICommandModel,
  ICommandResult,
  IConfiguration,
  IConfigurationFile,
  IFileLocator,
  IGenerator,
  IGeneratorModelFile,
  IModelLoaders,
  LoadModelFromOptions,
  LoadModelOptions,
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
    OUT_DIR: config.outDir ?? '.',
  };
}

function createFileLocator(cwd: string, outDir: string): IFileLocator {

  const atCWD = (...paths: string[]): string => {
    return path.normalize(joinPaths(cwd, ...paths));
  };

  const atBasePath = (...paths: string[]): string => {
    return path.normalize(joinPaths(process.cwd(), ...paths));
  };

  const atOutDir = (...paths: string[]): string =>
    atCWD(outDir, ...paths);

  return {
    outDir,
    atCWD,
    atBasePath,
    atOutDir,
  }
}

export function createConfiguration(
  config: IConfigurationFile
): IConfiguration {
  const requiredConfig: RequiredInitOptionsOnly & RequiredOutputOptionsOnly = {
    ...defaultInitOptions,
    ...defaultOutputOptions,
    ...config,
  };

  const variables: Variables = {
    ...process.env,
    ...createConfigVariables(requiredConfig),
  };

  const fileLocator = createFileLocator(requiredConfig.cwd, requiredConfig.outDir ?? '.')

  const modelLoaders = createModelLoaders(config, variables, createFallbackModelLoader(fileLocator), true);

  const modelValidators = createModelValidators(config, createFallbackModelValidator(fileLocator), true);

  const templateRunners = createTemplateRunners(config, createFallbackTemplateRunners(fileLocator), true);

  const templateHelpers = createTemplateHelpers(config, createFallbackTemplateHelpers(), true);

  return {
    ...requiredConfig,
    ...modelLoaders,
    ...modelValidators,
    ...templateRunners,
    ...templateHelpers,
    variables,
  };
}

async function loadGeneratorFromFile(
  name: string,
  basePath: string,
  configuration: IConfiguration,
  context: any
) {
  const candidateFiles = await globFiles(basePath, `${name}.*`);

  if (candidateFiles.length === 0) {
    consola.trace(
      `Generator '${sprintLabel(name)}' at '${sprintLabel(
        basePath
      )}' does not have an explicit model '${sprintLabel(name)}.*'`
    );
    return undefined;
  }

  if (candidateFiles.length > 1) {
    const found = sprintBadList(candidateFiles);
    consola.log(
      `Generator '${sprintLabel(name)}' at '${sprintLabel(
        basePath
      )}' have multiple explicit models: ${found}`
    );
    return undefined;
  }

  const modulePath = path.resolve(configuration.atCWD(candidateFiles[0]));

  const model: IGeneratorModelFile = await configuration.loadModelFromPath(
    modulePath,
    context,
    { isOptional: true, replaceVariables: true }
  );

  // TODO: Validate model

  return model;
}

export async function loadGeneratorModelFile(
  name: string,
  basePath: string,
  configuration: IConfiguration,
  context: any,
): Promise<IGeneratorModelFile | undefined> {
  const fromFile = await loadGeneratorFromFile(name, basePath, configuration, context);

  if (!!fromFile) {
    return fromFile;
  }

  // TODO: Load from folder structure based on conventions

  return undefined;
}

export async function loadCommand(
  commandModel: ICommandModel,
  generator: IGenerator,
  defaultCommandMode: CommandMode
): Promise<ICommand | undefined> {
  const commandMode: CommandMode = commandModel.module
    ? 'module'
    : commandModel.folder
    ? 'folder'
    : defaultCommandMode;

  const runCommand = (function () {
    switch (commandMode) {
      case 'module':
        return async function (
          context: ICommandContext
        ): Promise<ICommandResult | undefined> {
          // TODO: js, ts?
          const moduleFileName = commandModel.module
            ? commandModel.module
            : `${commandModel.name}.js`;

          const modulePath = path.resolve(generator.atCommands(moduleFileName));

          const commandModule = await import(modulePath);

          if (typeof commandModule?.default !== 'function') {
            consola.error(
              `Module '${modulePath}' does not export default function`
            );
            return undefined;
          }

          const commandResult: ICommandResult = await commandModule.default(
            context
          );

          return commandResult;
        };

      default:
        return async function (
          _context: ICommandContext
        ): Promise<ICommandResult | undefined> {
          consola.warn(
            `Command mode "${commandMode}" is no yet supported. Use mode "module" for the time being.`
          );
          return undefined;
        };
    }
  })();

  const variables = {
    ...generator.variables,
    COMMAND_NAME: commandModel.name,
  };

  // TODO: Add command outDir option
  const outDir = generator.outDir;

  const fileLocator = createFileLocator(generator.configuration.cwd, outDir)

  const modelLoaders = createModelLoaders(commandModel, variables, createFallbackModelLoader(fileLocator), false);

  const modelValidators = createModelValidators(commandModel, createFallbackModelValidator(fileLocator), true);

  const templateRunners = createTemplateRunners(commandModel, createFallbackTemplateRunners(fileLocator), false);

  const templateHelpers = createTemplateHelpers(commandModel, generator, false);

  const command: ICommand = {
    generator,
    variables,
    name: commandModel.name,
    caption: commandModel.caption,
    summary: commandModel.summary,
    details: commandModel.details,
    requireName: commandModel.requireName === true,
    requireModel: commandModel.requireModel === true,
    commandMode,

    ...modelLoaders,
    ...modelValidators,
    ...templateRunners,
    ...templateHelpers,

    runCommand,
    configuration: generator.configuration,
  };

  return command;
}

export async function loadGenerator(
  generatorName: string,
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

  const variables = {
    ...configuration.variables,
    GENERATOR_PATH: basePath,
    GENERATOR_NAME: generatorName,
  };

  const modelContext = {
    vars: variables,
  };

  let modelFile = await loadGeneratorModelFile(
    generatorName,
    basePath,
    configuration,
    modelContext,
  );

  // TODO: const isConventionBased = !generatorModelFile
  if (modelFile === undefined) {
    // TODO: Implement convention based generator
    consola.log(
      `Could not load generator '${sprintBad(generatorName)}' at '${sprintBad(
        basePath
      )}'`
    );
    return undefined;
  }

  // TODO: Validate model is fine
  const defaultCommandMode: CommandMode =
    modelFile.defaultCommandMode === 'module'
      ? 'module'
      : modelFile.defaultCommandMode === 'folder'
      ? 'folder'
      : 'module';

  const outDir = modelFile.outDir ?? configuration.outDir;

  const fileLocator = createFileLocator(configuration.cwd, outDir)

  const modelLoaders = createModelLoaders(modelFile, variables, createFallbackModelLoader(fileLocator), false);

  const modelValidators = createModelValidators(modelFile, createFallbackModelValidator(fileLocator), true);

  const templateRunners = createTemplateRunners(modelFile, createFallbackTemplateRunners(fileLocator), false);

  const templateHelpers = createTemplateHelpers(modelFile, configuration, false);
    
  const atGenerator = (...paths: string[]) => joinPaths(basePath, ...paths);
  const atCommands = (...paths: string[]) =>
    atGenerator(configuration.commandsFolder, ...paths);
  const atTemplates = (...paths: string[]) =>
    atGenerator(configuration.templatesFolder, ...paths);

  const getCommand = async (
    commandName: string
  ): Promise<ICommand | undefined> => {
    const commandModel = modelFile?.commands.find(
      (c) => c.name === commandName
    );

    if (!commandModel) {
      consola.error(
        `Command '${sprintBad(
          commandName
        )}' not found at generator '${sprintBad(generatorName)}'`
      );
      return undefined;
    }

    return await loadCommand(commandModel, generator, defaultCommandMode);
  };

  let getCommandsPromise: Promise<ICommand[] | undefined>;

  const getCommands = (): Promise<ICommand[] | undefined> => {
    if (!getCommandsPromise) {
      getCommandsPromise = (async function () {
        const commandLoaders = modelFile?.commands?.map((c) =>
          loadCommand(c, generator, defaultCommandMode)
        );

        if (!commandLoaders) {
          consola.error(
            `Could not retrieve commands from generator '${sprintBad(
              generatorName
            )}'`
          );
          return undefined;
        }

        const commands = await Promise.all(commandLoaders);

        if (commands.some((c) => !c)) {
          const successLoaded = commands.filter((c) => !!c);
          const errorMessage =
            successLoaded.length === 0
              ? `No command could be loaded from generator '${sprintBad(
                  generatorName
                )}'.`
              : `${
                  commands.length - successLoaded.length
                } commands could not be loaded from generator '${sprintBad(
                  generatorName
                )}'. Only the following were successfuly loaded: ${sprintGoodList(
                  successLoaded.map((c) => c?.name ?? '')
                )}`;
          consola.error(
            `Some commands could not be loaded from generator '${sprintBad(
              generatorName
            )}'. ${errorMessage}`
          );
          return undefined;
        }

        return commands as ICommand[];
      })();
    }
    return getCommandsPromise;
  };

  const generator: IGenerator = {
    generatorName,
    basePath,
    configuration,
    variables,

    defaultCommandMode,
    caption: modelFile.caption,
    summary: modelFile.summary,
    details: modelFile.details,
    tags: modelFile.tags ?? [],
    defaultEngine: modelFile.defaultEngine,
    defaultEngineOptions: modelFile.defaultEngineOptions,

    ...modelLoaders,
    ...modelValidators,
    ...templateRunners,
    ...templateHelpers,

    getCommands,
    getCommand,
    atGenerator,
    atCommands,
    atTemplates,
  };

  // consola.log('generator', generator)

  return generator;
}

// TODO: introduce model-transformations: jsonpath-plus, module, [], to generalize this step
export async function loadFormattedModel(
  model: string | any | undefined,
  modelFormat: string | undefined,
  modelLoaders: IModelLoaders,
  context: any,
  loadFromOptions?: LoadModelFromOptions
): Promise<any | undefined> {
  if (typeof model === 'string') {
    const modelPath = path.resolve(modelLoaders.atCWD(model));
    return await modelLoaders.loadModelFromPath(
      modelPath,
      context,
      { ...loadFromOptions, loaderName: modelFormat }
    );
  } else {
    return model;
  }
}

export async function applyModelJsonPath(
  model: any | undefined,
  jPath: string | undefined
) {
  if (!model || !jPath) {
    return model;
  }

  const jsonPath = await import('jsonpath-plus');

  const resultModel = jsonPath.JSONPath({ path: jPath, json: model });

  return resultModel;
}

export function applyModelExtraArgs(
  model: any | undefined,
  applyModelArgs: ((model: any) => any) | undefined
) {
  if (!model || !applyModelArgs) {
    return model;
  }

  const resultModel = applyModelArgs(model);

  return resultModel;
}

export async function loadModel(
  baseModel: any | undefined,
  options: LoadModelOptions,
  modelLoaders: IModelLoaders,
  context: any,
  loadFromOptions?: LoadModelFromOptions
): Promise<any | undefined> {
  const modelStage1 = baseModel
    ? baseModel
    : await loadFormattedModel(
        options.model,
        options.modelFormat,
        modelLoaders,
        context,
        loadFromOptions
      );

  const modelStage2 = applyModelJsonPath(modelStage1, options.jsonPath);

  const modelStage3 = applyModelExtraArgs(modelStage2, options.applyModelArgs);

  return modelStage3;
}
