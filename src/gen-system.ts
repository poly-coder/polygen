import fs from 'fs-extra';
import { Consola } from 'consola';
import chalk from 'chalk';
import * as changeCase from 'change-case';
import * as inflection from 'inflection';
import * as humanize from 'humanize-plus';
import {
  fsExistsAsDirectory,
  fsExistsAsFile,
  fsListDirectories,
  fsReadFileContent,
  fsWriteFileContent,
  joinPaths,
} from './file-utils';
import {
  CommandDescriptor,
  GeneratorDescriptor,
  GeneratorDescriptorData,
  GeneratorSystemConfig,
  IGeneratorsSystem,
  InitializeOptions,
  ListGeneratorsOptions,
  Mutable,
  RunCommandContext,
  RunCommandFunc,
  RunCommandResult,
  RunGeneratorOptions,
  Variables,
} from './gen-types';
import {
  createConfigHelpers,
  createGeneratorSystemConfig,
  extractVariables,
  pcgenConfigFileNames,
  replaceVariables,
} from './gen-configuration';
import { tracedError } from './logging';
import { findGeneratorEngine } from './generator-engines';
import { CopyCommandStep } from './gen-steps';
import path from 'path';

export function createGeneratorsSystem(
  config: GeneratorSystemConfig,
  console: Consola
): IGeneratorsSystem {
  // TODO: Define PCGEN_GENERATORS_HOME env var. Multiple sources?
  // TODO: Look for parent folders when not found?

  const helpers = {
    config: createConfigHelpers(config),
    env: process.env,
    case: changeCase,
    inflection,
    humanize,
  };

  // console.trace('config', config);
  // console.trace('helpers.config', helpers.config);
  // console.trace('helpers', helpers);

  const variables = extractVariables(helpers);
  console.trace('variables', variables);

  const isInitialized = async () => {
    for (const fileName of pcgenConfigFileNames) {
      const fullPath = helpers.config.atCwdFullPath(fileName);
      if (await fsExistsAsFile(fullPath)) {
        console.trace(`isInitialized: Found config file at: '${fullPath}'`);
        return true;
      } else {
        console.trace(
          `isInitialized: Did not found config file at: '${fullPath}'`
        );
      }
    }
    console.trace(`isInitialized: Did not found anyconfig file`);
    return false;
  };

  const createInitializeOptions = (
    options: InitializeOptions
  ): GeneratorSystemConfig => {
    const newConfig: Partial<Mutable<GeneratorSystemConfig>> = {};

    if (!!options.searchPaths) {
      newConfig.searchPaths = options.searchPaths.split(';');
    }

    if (!!options.basePath) {
      newConfig.basePath = options.basePath;
    }

    if (!!options.pcgenFolder) {
      newConfig.pcgenFolder = options.pcgenFolder;
    }

    if (!!options.generatorFolder) {
      newConfig.generatorFolder = options.generatorFolder;
    }

    if (!!options.commandsFolder) {
      newConfig.commandsFolder = options.commandsFolder;
    }

    if (!!options.templatesFolder) {
      newConfig.templatesFolder = options.templatesFolder;
    }

    if (!!options.defaultCommand) {
      newConfig.defaultCommand = options.defaultCommand;
    }

    if (!!options.cwd) {
      newConfig.cwd = options.cwd;
    }

    if (!!options.generatorAssets) {
      newConfig.generatorAssets = options.generatorAssets;
    }

    return createGeneratorSystemConfig(newConfig);
  };

  const initialize = async (options: InitializeOptions) => {
    if (!(await isInitialized())) {
      console.trace('initialize: Initializing pcgen ...');

      const newConfig = createInitializeOptions(options);
      const configHelpers = createConfigHelpers(newConfig);

      const source = newConfig.generatorAssets;
      const target = configHelpers.atPcgenFullPath(newConfig.generatorFolder);
      fs.copy(source, target);
      console.trace(`initialize: Copied folder "${source}" to "${target}"`);

      const configPath = configHelpers.atCwdFullPath(pcgenConfigFileNames[0]);
      const jsonContent = JSON.stringify(newConfig, null, 4);
      await fsWriteFileContent(configPath, jsonContent);
      console.trace(`initialize: Writen config at "${configPath}"`);
    }
  };

  const ensureInitialized = async () => {
    if (!(await isInitialized())) {
      console.info(
        `You must use command '${chalk.greenBright(
          "'pcgen init'"
        )}' before start using pcgen`
      );
      return false;
    }
    return true;
  };

  const createRunCommand = (generatorFullPath: string, jsFileName: string) => {
    const runCommand = async (context: RunCommandContext) => {
      const modulePath = helpers.config.atCommandsPath(
        generatorFullPath,
        jsFileName
      );

      console.trace(
        `createRunCommand: Loading module ${jsFileName} at: `,
        modulePath
      );

      // TODO: try catch this to give a better error report
      const cmdModule = await import(modulePath);

      if (typeof cmdModule?.default?.run !== 'function') {
        throw tracedError(
          console,
          `Module '${modulePath}' does not exports function ${chalk.redBright(
            'run(context)'
          )}`
        );
      }

      const runFunc: RunCommandFunc = cmdModule.default.run;

      const result: RunCommandResult | null = await runFunc(context);

      // TODO: Validate result

      return result;
    };

    return runCommand;
  };

  const locateGenerator = async (
    generatorName: string
  ): Promise<string | undefined> => {
    if (!generatorName) {
      throw new Error('Generator name cannot be empty');
    }

    for (const searchPath of [
      helpers.config.baseFullPath,
      ...config.searchPaths,
    ]) {
      console.trace(
        `locateGenerator: Locating generator '${generatorName}' at path '${searchPath}'`
      );

      const searchFullPath = helpers.config.atCwdFullPath(searchPath);
      console.trace(
        `locateGenerator: Locating generator '${generatorName}' at full path '${searchFullPath}'`
      );

      const generatorFullPath = joinPaths(
        searchFullPath,
        config.pcgenFolder,
        generatorName
      );
      console.trace(
        `locateGenerator: Expected generator '${generatorName}' full path would be at '${generatorFullPath}'`
      );

      if (await fsExistsAsDirectory(generatorFullPath)) {
        console.trace(
          chalk.greenBright(
            `locateGenerator: Generator '${generatorName}' found at '${generatorFullPath}'`
          )
        );
        return generatorFullPath;
      }
      console.trace(
        chalk.yellowBright(
          `locateGenerator: Generator '${generatorName}' not found at '${generatorFullPath}'`
        )
      );
    }

    console.trace(
      chalk.redBright(
        `locateGenerator: Generator '${generatorName}' not found at anywhere`
      )
    );
    return undefined;
  };

  const searchGeneratorNames = async (
    generatorName?: string | RegExp
  ): Promise<string[]> => {
    const result: string[] = [];

    for (const searchPath of [
      helpers.config.baseFullPath,
      ...config.searchPaths,
    ]) {
      console.trace(`searchGeneratorNames: Searching at path '${searchPath}'`);

      const searchFullPath = helpers.config.atCwdFullPath(searchPath);
      console.trace(
        `searchGeneratorNames: Searching at full path '${searchFullPath}'`
      );

      const pcgenFullPath = joinPaths(searchFullPath, config.pcgenFolder);
      console.trace(
        `searchGeneratorNames: Searching at pcgen path '${pcgenFullPath}'`
      );

      const directoryNames = await fsListDirectories(pcgenFullPath);
      console.trace(
        `searchGeneratorNames: Found directories: ${directoryNames.join(', ')}`
      );

      for (const directoryName of directoryNames) {
        if (generatorName && !directoryName.match(generatorName)) {
          continue;
        }
        result.push(directoryName);
      }
    }

    return result;
  };

  const getGeneratorDescriptorJsonFileName = (generatorName: string) =>
    `${generatorName}.json`;

  const readGeneratorDescriptorDataAsJson = async (
    generatorName: string,
    generatorFullPath: string,
    ...variables: Variables[]
  ): Promise<GeneratorDescriptorData> => {
    const fileFullPath = joinPaths(
      generatorFullPath,
      getGeneratorDescriptorJsonFileName(generatorName)
    );

    try {
      const jsonContent = await fsReadFileContent(fileFullPath);

      if (jsonContent) {
        const data: GeneratorDescriptorData = JSON.parse(
          replaceVariables(jsonContent, ...variables)
        );

        console.trace(
          'readGeneratorDescriptorAsJson: Read from ',
          fileFullPath
        );

        return data;
      } else {
        throw tracedError(
          console,
          `readGeneratorDescriptorAsJson: Not found at "${fileFullPath}"`
        );
      }
    } catch (error) {
      throw tracedError(
        console,
        `readGeneratorDescriptorAsJson: Error reading from "${fileFullPath}"`
      );
    }
  };

  const createGeneratorDescriptor = (
    data: GeneratorDescriptorData,
    generatorName: string,
    generatorFullPath: string
  ): GeneratorDescriptor => {
    const outDir = data.outDir ? helpers.config.atCwdFullPath(data.outDir) : helpers.config.cwd

    const commands = data.commands.map((cmdData) => {
      const command: CommandDescriptor = {
        data: cmdData,
        runCommand: createRunCommand(generatorFullPath, cmdData.js),
        get generator() {
          return generator;
        },
      };
      return command;
    });

    const generator: GeneratorDescriptor = {
      data,
      name: generatorName,
      fullPath: generatorFullPath,
      engine: findGeneratorEngine(data.engine, console),
      commands,
      outDir,
    };

    return generator;
  };

  const loadGenerator = async (
    generatorName: string
  ): Promise<GeneratorDescriptor | undefined> => {
    const generatorFullPath = await locateGenerator(generatorName);

    if (!generatorFullPath) {
      return undefined;
    }

    const generatorData = await readGeneratorDescriptorDataAsJson(
      generatorName,
      generatorFullPath,
      variables,
      helpers.env
    );

    const generator = createGeneratorDescriptor(
      generatorData,
      generatorName,
      generatorFullPath
    );

    return generator;
  };

  const getGeneratorDescriptor = async (generatorName: string) => {
    return await loadGenerator(generatorName);
  };

  const listGenerators = async (options: ListGeneratorsOptions) => {
    return await searchGeneratorNames(options.name);
  };

  const copyProcessor = async (
    step: CopyCommandStep,
    context: RunCommandContext,
    _opts: RunGeneratorOptions
  ) => {
    // TODO: Add RunCommandRuntime type to hold all changes before applying them all
    const fromFullPath = helpers.config.atTemplatesPath(context.generatorDescriptor.fullPath, step.from)
    const toFullPath = joinPaths(context.generatorDescriptor.outDir, step.to)

    console.trace(`copyProcessor: Copying from '${fromFullPath}' to '${toFullPath}'`)

    await fs.ensureDir(path.dirname(toFullPath))

    await fs.copyFile(fromFullPath, toFullPath)
  };

  const stepProcessors: Record<
    string,
    | ((step: any, context: RunCommandContext, opts: RunGeneratorOptions) => Promise<void>)
    | undefined
  > = {
    copy: copyProcessor,
    // file: fileProcessor,
    // snippet: snippetProcessor,
    // generator: generatorProcessor,
  };

  const processGenerator = async (
    parentContext: RunCommandContext | null,
    opts: RunGeneratorOptions
  ) => {
    console.trace('processGenerator: opts', opts);

    let [generator, command] = opts.generator.split(':');

    command = command ?? helpers.config.defaultCommand;

    console.trace(
      `processGenerator: Running ${chalk.greenBright(
        generator
      )}'s ${chalk.greenBright(command)} command`
    );

    // TODO: Optimize loading only the given command, instead of the entire generator
    const generatorDescriptor = await loadGenerator(generator);

    if (!generatorDescriptor) {
      throw tracedError(
        console,
        `processGenerator: Generator '${chalk.redBright(
          generator
        )}' does not exists. Run '${chalk.greenBright(
          `pcgen new generator {opts.generator}`
        )}' to create it.`
      );
    }

    var commandDescriptor = generatorDescriptor.commands.find(
      (c) => c.data.name == command
    );

    if (!commandDescriptor) {
      tracedError(
        console,
        `processGenerator: Command '${chalk.redBright(
          command
        )}' does not exists in generator '${chalk.greenBright(
          generator
        )}'. Create file '${chalk.greenBright(
          helpers.config.atCommandsPath(generator, command)
        )}' to enable it`
      );
      return;
    }

    const context: RunCommandContext = {
      parent: parentContext,
      name: opts.name,
      model: undefined,
      h: helpers,
      console,
      genSystem,
      generatorDescriptor,
      commandDescriptor,
    };

    // console.trace('processGenerator: context', context)

    const runResult = await context.commandDescriptor.runCommand(context);

    // TODO: Validate runResult with joi/jsonSchema

    // console.trace('runResult', runResult);

    for (const step of runResult?.steps ?? []) {
      const stepProcessor = stepProcessors[step.type];

      if (!stepProcessor) {
        throw tracedError(
          console,
          `There is no processor for a step of type '${chalk.red(step.type)}'`
        );
      }

      // TODO: Create context specific for step?
      await stepProcessor(step, context, opts)
    }
  };

  const runGenerator = async (opts: RunGeneratorOptions) => {
    await processGenerator(null, opts);
  };

  const genSystem: IGeneratorsSystem = {
    isInitialized,
    initialize,
    ensureInitialized,
    getGeneratorDescriptor,
    listGenerators,
    runGenerator,
  };

  return genSystem;
}
