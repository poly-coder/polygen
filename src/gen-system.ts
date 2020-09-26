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
  GeneratorRuntime,
  GeneratorSystemConfig,
  IGeneratorsSystem,
  InitializeOptions,
  ListGeneratorsOptions,
  Mutable,
  RunCommandContext,
  RunCommandFunc,
  RunCommandResult,
  RunGeneratorOptions,
} from './gen-types';
import {
  createConfigHelpers,
  createGeneratorSystemConfig,
  pcgenConfigFileNames,
} from './gen-configuration';
import { shorten, tracedError } from './logging';
import {
  findTemplateEngine,
  findTemplateEngineFromExtension,
  TemplateEngine,
} from './generator-engines';
import {
  CopyCommandStep,
  FileCommandStep,
  SnippetCommandStep,
} from './gen-steps';
import path from 'path';
import { findModelFormat, findModelFormatFromExtension } from './model-formats';

export function createGeneratorsSystem(
  config: GeneratorSystemConfig,
  console: Consola
): IGeneratorsSystem {
  // TODO: Look for parent folders when not found?

  const helpers = {
    config: createConfigHelpers(config),
    env: process.env,
    case: changeCase,
    inflection,
    humanize,
  };

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

    if (!!options.initAssets) {
      newConfig.initAssets = options.initAssets;
    }

    return createGeneratorSystemConfig(newConfig);
  };

  const initialize = async (options: InitializeOptions) => {
    if (!(await isInitialized())) {
      console.trace('initialize: Initializing pcgen ...');

      const newConfig = createInitializeOptions(options);
      const configHelpers = createConfigHelpers(newConfig);

      const source = joinPaths(newConfig.initAssets, 'generator');
      const target = configHelpers.atPcgenFullPath(newConfig.generatorFolder);
      fs.copy(source, target);
      console.trace(`initialize: Copied folder "${source}" to "${target}"`);

      const sourceGitIgnore = joinPaths(newConfig.initAssets, '_gitignore');
      const targetGitIgnore = configHelpers.atPcgenFullPath('.gitignore');
      fs.copy(sourceGitIgnore, targetGitIgnore);
      console.trace(
        `initialize: Copied file "${sourceGitIgnore}" to "${targetGitIgnore}"`
      );

      const configPath = configHelpers.atCwdFullPath(options.configFile ?? pcgenConfigFileNames[0]);
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

      if (typeof cmdModule?.default !== 'function') {
        throw tracedError(
          console,
          `Module '${modulePath}' does not exports default function`
        );
      }

      const runFunc: RunCommandFunc = cmdModule.default;

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
      const searchFullPath = helpers.config.atCwdFullPath(searchPath);
      console.trace(
        `locateGenerator: Locating generator '${generatorName}' at path '${searchFullPath}'`
      );

      const generatorFullPath = joinPaths(
        searchFullPath,
        config.pcgenFolder,
        generatorName
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
        `locateGenerator: Generator '${generatorName}' not found anywhere`
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
      const searchFullPath = helpers.config.atCwdFullPath(searchPath);
      const pcgenFullPath = joinPaths(searchFullPath, config.pcgenFolder);

      console.trace(
        `searchGeneratorNames: Searching at path '${pcgenFullPath}'`
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
  ): Promise<GeneratorDescriptorData> => {
    const fileFullPath = joinPaths(
      generatorFullPath,
      getGeneratorDescriptorJsonFileName(generatorName)
    );

    try {
      const jsonContent = await fsReadFileContent(fileFullPath);

      if (jsonContent) {
        const data: GeneratorDescriptorData = JSON.parse(jsonContent);

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
    const outDir = path.relative(
      helpers.config.cwd,
      data.outDir
        ? helpers.config.atCwdFullPath(data.outDir)
        : helpers.config.cwd
    );

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
      engine: findTemplateEngine(data.engine, console),
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

  const canOverwrite = (
    localOverwrite: boolean | undefined,
    context: RunCommandContext,
    opts: RunGeneratorOptions
  ) => {
    // If the user says so, it is what it is
    if (opts.overwrite !== undefined) {
      return opts.overwrite;
    }

    if (localOverwrite !== undefined) {
      return localOverwrite;
    }

    const commandOverwrite = context.commandDescriptor.data.overwrite;
    if (commandOverwrite !== undefined) {
      return commandOverwrite;
    }

    const generatorOverwrite = context.generatorDescriptor.data.overwrite;
    if (generatorOverwrite !== undefined) {
      return generatorOverwrite;
    }

    // Do not overwrite by default
    return false;
  };

  const searchTemplateEngine = (
    localEngine: string | undefined,
    localEngineOptions: any | undefined,
    fileExtension: string,
    context: RunCommandContext
  ): [TemplateEngine, any] => {
    let engine = findTemplateEngine(localEngine, console);

    if (engine) {
      return [engine, localEngineOptions];
    }

    engine = context.generatorDescriptor.engine;

    if (engine) {
      return [engine, context.generatorDescriptor.engineOptions];
    }

    return [findTemplateEngineFromExtension(fileExtension, console), undefined];
  };

  const loadModel = async (
    model: string | any | undefined,
    modelFormat: string | undefined,
    jsonPath: string | undefined,
    previousModel?: any
  ): Promise<any> => {
    if (jsonPath) {
      const baseModel = await loadModel(
        model,
        modelFormat,
        undefined,
        previousModel
      );
      const jpp = await import('jsonpath-plus');
      const result = jpp.JSONPath({ path: jsonPath, json: baseModel });
      return result;
    }

    if (typeof model === 'string') {
      let loader = findModelFormat(modelFormat, console);
      if (!loader) {
        loader = findModelFormatFromExtension(path.extname(model), console);
      }
      const filePath = helpers.config.atCwdFullPath(model);
      model = await loader!.load(filePath);
    }

    if (model) {
      return model;
    }

    return previousModel;
  };

  const findContainerPosition = (
    container: string,
    searchText: string | undefined,
    searchExpr: string | undefined,
    logPrefix: string
  ): [number, number] => {
    let index = -1;
    let length = -1;
    let regexp = searchExpr ? new RegExp(searchExpr) : undefined;

    if (regexp) {
      const match = container.match(regexp);

      if (match) {
        index = match.index ?? -1;
        length = match[0].length;
      }
    } else if (searchText) {
      index = container.indexOf(searchText);
      length = searchText.length;
    } else {
      throw tracedError(
        console,
        `${logPrefix}: Snippet steps have to specify both start and end boundaries`
      );
    }

    if (index === -1) {
      throw tracedError(
        console,
        `${logPrefix}: Didn't found the boundaries for snippet insertion`
      );
    }

    // Look for line start and end
    while (index + length + 1 < container.length) {
      if (container[index + length + 1] == '\r') {
        if (
          index + length + 2 < container.length &&
          container[index + length + 2] == '\n'
        ) {
          length += 2;
          break;
        } else {
          length += 1;
          break;
        }
      } else if (container[index + length + 1] == '\n') {
        length += 1;
        break;
      } else {
        length += 1;
      }
    }

    while (index >= 1) {
      if (container[index - 1] === '\r' || container[index - 1] === '\n') {
        break;
      } else {
        index -= 1;
        length += 1;
      }
    }

    return [index, length];
  };

  const copyProcessor = async (
    step: CopyCommandStep,
    context: RunCommandContext,
    opts: RunGeneratorOptions,
    runtime: GeneratorRuntime
  ) => {
    const prefix = `copyProcessor${step.stepName ? `[${step.stepName}]` : ''}`;
    const fromFullPath = helpers.config.atTemplatesPath(
      context.generatorDescriptor.fullPath,
      step.from
    );
    const toPath = joinPaths(context.generatorDescriptor.outDir, step.to);

    if (
      !canOverwrite(step.overwrite, context, opts) &&
      (await runtime.fileExists(toPath))
    ) {
      console.trace(
        `${prefix}: File '${toPath}' already exists and 'override' is set to 'false'`
      );
      return;
    }

    console.trace(`${prefix}: Copying from '${fromFullPath}' to '${toPath}'`);

    const content = await fsReadFileContent(fromFullPath);

    if (content === undefined) {
      throw tracedError(
        console,
        `${prefix}: Source file '${fromFullPath}' does not exists`
      );
    }

    runtime.writeFile(toPath, content);
  };

  const fileProcessor = async (
    step: FileCommandStep,
    context: RunCommandContext,
    opts: RunGeneratorOptions,
    runtime: GeneratorRuntime
  ) => {
    const prefix = `fileProcessor${step.stepName ? `[${step.stepName}]` : ''}`;
    const fromFullPath = helpers.config.atTemplatesPath(
      context.generatorDescriptor.fullPath,
      step.from
    );
    const toPath = joinPaths(context.generatorDescriptor.outDir, step.to);

    if (
      !canOverwrite(step.overwrite, context, opts) &&
      (await runtime.fileExists(toPath))
    ) {
      console.trace(
        `${prefix}: File '${toPath}' already exists and 'override' is set to 'false'`
      );
      return;
    }

    console.trace(
      `${prefix}: Generating template from '${fromFullPath}' to '${toPath}'`
    );

    const model = await loadModel(
      step.model,
      step.modelFormat,
      step.jsonPath,
      context.model
    );

    const childContext = await createContext(opts, model, context);

    const [engine, engineOptions] = searchTemplateEngine(
      step.engine,
      step.engineOptions,
      path.extname(step.from),
      context
    );

    console.trace(`${prefix}: Using template engine '${engine.name}'`);

    const content = await engine.execute(
      fromFullPath,
      childContext,
      engineOptions
    );

    runtime.writeFile(toPath, content);
  };

  const snippetProcessor = async (
    step: SnippetCommandStep,
    context: RunCommandContext,
    opts: RunGeneratorOptions,
    runtime: GeneratorRuntime
  ) => {
    const prefix = `snippetProcessor${
      step.stepName ? `[${step.stepName}]` : ''
    }`;
    const fromFullPath = helpers.config.atTemplatesPath(
      context.generatorDescriptor.fullPath,
      step.from
    );
    const toPath = joinPaths(context.generatorDescriptor.outDir, step.to);

    // if (!canOverwrite(step.overwrite, context, opts) && await runtime.fileExists(toPath)) {
    //   console.trace(`${prefix}: File '${toPath}' already exists and 'override' is set to 'false'`)
    //   return
    // }

    console.trace(
      `${prefix}: Generating snippet from '${fromFullPath}' to '${toPath}'`
    );

    const currentContent = await runtime.readFile(toPath);

    if (currentContent === undefined) {
      throw tracedError(
        console,
        `${prefix}: File '${toPath}' does not exists, and snippets require to be inserted in existing files. Add a previous step to create the container file previous to the snippet step.`
      );
    }

    const [startIndex, startLength] = findContainerPosition(
      currentContent,
      step.start,
      step.startRegExp,
      prefix
    );

    const [endIndex] = findContainerPosition(
      currentContent,
      step.end,
      step.endRegExp,
      prefix
    );

    if (endIndex < startIndex + startLength) {
      throw tracedError(
        console,
        `${prefix}: Found snippet boundaries in the wrong position`
      );
    }

    const model = await loadModel(
      step.model,
      step.modelFormat,
      step.jsonPath,
      context.model
    );

    const childContext = await createContext(opts, model, context);

    const [engine, engineOptions] = searchTemplateEngine(
      step.engine,
      step.engineOptions,
      path.extname(step.from),
      context
    );

    console.trace(`${prefix}: Using template engine '${engine.name}'`);

    const snippet = await engine.execute(fromFullPath, childContext, engineOptions);

    // Insert snippet into currentContent

    const startContent = currentContent.substring(0, startIndex + startLength);
    const endContent = currentContent.substring(endIndex);
    const content = `${startContent}${snippet}${endContent}`;

    runtime.writeFile(toPath, content);
  };

  const stepProcessors: Record<
    string,
    | ((
        step: any,
        context: RunCommandContext,
        opts: RunGeneratorOptions,
        runtime: GeneratorRuntime
      ) => Promise<void>)
    | undefined
  > = {
    copy: copyProcessor,
    file: fileProcessor,
    snippet: snippetProcessor,
    // generator: generatorProcessor,
  };

  const createContext = async (
    opts: RunGeneratorOptions,
    currentModel: any | undefined,
    parentContext: RunCommandContext
  ): Promise<RunCommandContext> => {
    const name = opts.name ?? parentContext.name;

    if (parentContext.generatorDescriptor.data.requireName && !name) {
      throw tracedError(
        console,
        `<name> parameter is required for this generator to run`
      );
    }

    if (parentContext.commandDescriptor.data.requireName && !name) {
      throw tracedError(
        console,
        `<name> parameter is required for this command to run`
      );
    }

    const model: any = currentModel
      ? currentModel
      : await loadModel(
          opts.model,
          opts.modelFormat,
          opts.jsonPath,
          parentContext.model
        );

    if (parentContext.generatorDescriptor.data.requireModel && !model) {
      throw tracedError(
        console,
        `Model is required for this generator to run. Use option --model for it.`
      );
    }

    if (parentContext.commandDescriptor.data.requireModel && !model) {
      throw tracedError(
        console,
        `Model is required for this command to run. Use option --model for it.`
      );
    }

    const context: RunCommandContext = {
      ...parentContext,
      parent: parentContext,
      name: opts.name ?? parentContext.name,
      model,
    };

    return context;
  };

  const getGeneratorAndCommand = async (
    generatorName: string
  ): Promise<[GeneratorDescriptor, CommandDescriptor]> => {
    let [generator, command] = generatorName.split(':');

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
          `pcgen new generator {generatorName}`
        )}' to create it.`
      );
    }

    var commandDescriptor = generatorDescriptor.commands.find(
      (c) => c.data.name == command
    );

    if (!commandDescriptor) {
      throw tracedError(
        console,
        `processGenerator: Command '${chalk.redBright(
          command
        )}' does not exists in generator '${chalk.greenBright(
          generator
        )}'. Create file '${chalk.greenBright(
          helpers.config.atCommandsPath(generator, command)
        )}' to enable it`
      );
    }

    return [generatorDescriptor, commandDescriptor];
  };

  const processGenerator = async (
    parentContext: RunCommandContext,
    opts: RunGeneratorOptions,
    runtime: GeneratorRuntime
  ) => {
    const [
      generatorDescriptor,
      commandDescriptor,
    ] = await getGeneratorAndCommand(opts.generator);

    const context = await createContext(opts, undefined, {
      parent: null,
      ...parentContext,
      generatorDescriptor,
      commandDescriptor,
    });

    const runResult = await context.commandDescriptor.runCommand(context);

    // TODO: Validate runResult with joi/jsonSchema

    for (const step of runResult?.steps ?? []) {
      if (step.skip) {
        continue;
      }

      if (opts.step) {
        const allowedSteps = opts.step.split(',').map(s => s.trim()).filter(s => !!s)
        if (!step.stepName && !allowedSteps.includes(step.stepName ?? '')) {
          continue
        }
      }

      const stepProcessor = stepProcessors[step.type];

      if (!stepProcessor) {
        throw tracedError(
          console,
          `There is no processor for a step of type '${chalk.red(step.type)}'`
        );
      }

      // TODO: Create context specific for step?
      await stepProcessor(step, context, opts, runtime);
    }
  };

  const createRuntime = (opts: RunGeneratorOptions) => {
    const fileMap = new Map<string, string>();

    const fileExists = async (filePath: string) => {
      const normalizedPath = path.normalize(filePath);

      if (fileMap.has(normalizedPath)) {
        return true;
      }

      return await fsExistsAsFile(helpers.config.atCwdFullPath(normalizedPath));
    };

    const writeFile = (filePath: string, content: string) => {
      const normalizedPath = path.normalize(filePath);

      console.trace(
        `runtime:writeFile '${normalizedPath}' with ${content.length} bytes`
      );

      fileMap.set(normalizedPath, content);
    };

    const readFile = async (filePath: string) => {
      const normalizedPath = path.normalize(filePath);

      const content = fileMap.get(normalizedPath);
      if (content !== undefined) {
        console.trace(
          `runtime:readFile '${normalizedPath}' from FILE MAP with ${content.length} bytes`
        );
        return content;
      }

      const fileContent = await fsReadFileContent(
        helpers.config.atCwdFullPath(normalizedPath)
      );

      if (fileContent) {
        console.trace(
          `runtime:readFile '${normalizedPath}' from CWD with '${shorten(
            fileContent,
            40
          )}'`
        );
      } else {
        console.trace(`runtime:readFile '${normalizedPath}' NOT FOUND`);
      }

      return fileContent;
    };

    const execute = async () => {
      const toStdOut = !!opts.stdout;
      const toFiles = !opts.dryRun;

      for (const [normalizedPath, content] of fileMap.entries()) {
        const fullPath = helpers.config.atCwdFullPath(normalizedPath);
        const alreadyExists = await fsExistsAsFile(fullPath);

        if (alreadyExists) {
          console.info(
            `${chalk.yellowBright('Modified')} file '${chalk.cyanBright(
              normalizedPath
            )}' with ${content.length} bytes`
          );
        } else {
          console.info(
            `${chalk.greenBright('Added')} file '${chalk.cyanBright(
              normalizedPath
            )}' with ${content.length} bytes`
          );
        }

        if (toFiles) {
          await fsWriteFileContent(fullPath, content);

          console.trace(
            `runtime:execute Written '${normalizedPath}' with ${content.length} bytes`
          );
        }

        if (toStdOut) {
          global.console.log(
            '----------------------------------------------------'
          );
          global.console.log(content);
          global.console.log(
            '----------------------------------------------------'
          );
        }
      }
    };

    const runtime: GeneratorRuntime = {
      fileExists,
      readFile,
      writeFile,
      execute,
    };

    return runtime;
  };

  const runGenerator = async (opts: RunGeneratorOptions) => {
    const runtime = createRuntime(opts);

    const rootContext = {
      parent: null,
      name: undefined,
      model: undefined,
      h: helpers,
      console,
      genSystem,
    } as RunCommandContext;

    await processGenerator(rootContext, opts, runtime);

    await runtime.execute();
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
