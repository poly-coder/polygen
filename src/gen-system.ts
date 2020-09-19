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
  Variables,
} from './gen-types';
import {
  createConfigHelpers,
  createGeneratorSystemConfig,
  extractVariables,
  pcgenConfigFileNames,
  replaceVariables,
} from './gen-configuration';
import { tracedError } from './utils';
import { findGeneratorEngine } from './generator-engines';

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
    console,
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
        console.trace(`isInitialized: Found config file at: '${fullPath}'`)
        return true
      } else {
        console.trace(`isInitialized: Did not found config file at: '${fullPath}'`)
      }
    }
    console.trace(`isInitialized: Did not found anyconfig file`)
    return false
  }

  const createInitializeOptions = (options: InitializeOptions): GeneratorSystemConfig => {
    const newConfig: Partial<Mutable<GeneratorSystemConfig>> = {}

    if (!!options.searchPaths) {
      newConfig.searchPaths = options.searchPaths.split(';')
    }

    if (!!options.basePath) {
      newConfig.basePath = options.basePath
    }

    if (!!options.pcgenFolder) {
      newConfig.pcgenFolder = options.pcgenFolder
    }

    if (!!options.generatorFolder) {
      newConfig.generatorFolder = options.generatorFolder
    }

    if (!!options.commandsFolder) {
      newConfig.commandsFolder = options.commandsFolder
    }

    if (!!options.templatesFolder) {
      newConfig.templatesFolder = options.templatesFolder
    }

    if (!!options.defaultCommand) {
      newConfig.defaultCommand = options.defaultCommand
    }

    if (!!options.cwd) {
      newConfig.cwd = options.cwd
    }

    if (!!options.generatorAssets) {
      newConfig.generatorAssets = options.generatorAssets
    }

    return createGeneratorSystemConfig(newConfig)
  }

  const initialize = async (options: InitializeOptions) => {
    if (!(await isInitialized())) {
      console.trace('initialize: Initializing pcgen ...');

      const newConfig = createInitializeOptions(options)
      const configHelpers = createConfigHelpers(newConfig)
      
      const source = newConfig.generatorAssets;
      const target = configHelpers.atPcgenFullPath(newConfig.generatorFolder);
      fs.copy(source, target);
      console.trace(`initialize: Copied folder "${source}" to "${target}"`);
      
      const configPath = configHelpers.atCwdFullPath(pcgenConfigFileNames[0])
      const jsonContent = JSON.stringify(newConfig, null, 4)
      await fsWriteFileContent(configPath, jsonContent)
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

  //   const createRunCommand = (generatorName: string, jsFileName: string) => {
  //     const runCommand = async (context: RunCommandContext) => {
  //       const modulePath = joinPaths(
  //         cwd,
  //         pcgenFolder,
  //         generatorName,
  //         commandsSubFolder,
  //         jsFileName
  //       );

  //       console.trace(
  //         `createRunCommand: Loading module ${jsFileName} at: `,
  //         modulePath
  //       );

  //       // const cmdModule = await import(modulePath)
  //       const cmdModule = await import(modulePath);

  //       if (typeof cmdModule?.default?.run !== 'function') {
  //         console.error(
  //           `Module '${modulePath}' does not exports function ${chalk.redBright(
  //             'run(context)'
  //           )}`
  //         );
  //         return null;
  //       }

  //       const runFunc: RunCommandFunc = cmdModule.default.run;

  //       const result: RunCommandResult | null = await runFunc(context);

  //       // TODO: Validate result

  //       return result;
  //     };

  //     return runCommand;
  //   };

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
      console.trace(`locateGenerator: Locating generator '${generatorName}' at path '${searchPath}'`)
      
      const searchFullPath = helpers.config.atCwdFullPath(searchPath);
      console.trace(`locateGenerator: Locating generator '${generatorName}' at full path '${searchFullPath}'`)

      const generatorFullPath = joinPaths(
        searchFullPath,
        config.pcgenFolder,
        generatorName
      );
      console.trace(`locateGenerator: Expected generator '${generatorName}' full path would be at '${generatorFullPath}'`)
      
      if (await fsExistsAsDirectory(generatorFullPath)) {
        console.trace(chalk.greenBright(`locateGenerator: Generator '${generatorName}' found at '${generatorFullPath}'`))
        return generatorFullPath;
      }
      console.trace(chalk.yellowBright(`locateGenerator: Generator '${generatorName}' not found at '${generatorFullPath}'`))
    }
    
    console.trace(chalk.redBright(`locateGenerator: Generator '${generatorName}' not found at anywhere`))
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
      console.trace(`searchGeneratorNames: Searching at path '${searchPath}'`)
      
      const searchFullPath = helpers.config.atCwdFullPath(searchPath);
      console.trace(`searchGeneratorNames: Searching at full path '${searchFullPath}'`)
      
      const pcgenFullPath = joinPaths(searchFullPath, config.pcgenFolder);
      console.trace(`searchGeneratorNames: Searching at pcgen path '${pcgenFullPath}'`)
      
      const directoryNames = await fsListDirectories(pcgenFullPath);
      console.trace(`searchGeneratorNames: Found directories: ${directoryNames.join(', ')}`)

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
    const commands = data.commands.map((cmdData) => {
      const command: CommandDescriptor = {
        data: cmdData,
        runCommand: async () => {
          return null;
        },
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
      generatorFullPath
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

  // const processGenerator = async (
  //   parentContext: RunCommandContext | null,
  //   opts: RunGeneratorOptions
  // ) => {
  //   // console.trace('processGenerator: opts', opts)

  //   const name = opts.name ?? defaultGeneratorCommand;

  //   console.trace(
  //     `processGenerator: Running ${chalk.greenBright(
  //       opts.generator
  //     )}'s ${chalk.greenBright(name)} command`
  //   );

  //   // TODO: Optimize loading only the given command, instead of the entire generator
  //   const generatorDescriptor = await ensureGeneratorDescriptor(
  //     opts.generator,
  //     undefined
  //   );

  //   if (!generatorDescriptor) {
  //     console.error(
  //       `processGenerator: Generator '${chalk.redBright(
  //         opts.generator
  //       )}' does not exists. Run '${chalk.greenBright(
  //         `pcgen new generator {opts.generator}`
  //       )}' to create it.`
  //     );
  //     return;
  //   }

  //   var commandDescriptor = generatorDescriptor.commands.find(
  //     (c) => c.name == name
  //   );

  //   if (!commandDescriptor) {
  //     console.error(
  //       `processGenerator: Command '${chalk.redBright(
  //         name
  //       )}' does not exists in generator '${chalk.greenBright(
  //         opts.generator
  //       )}'. Create file '${chalk.greenBright(
  //         commandPath(opts.generator, name)
  //       )}' to enable it`
  //     );
  //     return;
  //   }

  //   const context: RunCommandContext = {
  //     parent: parentContext,
  //     console,
  //     env: createEnvVariables(opts.generator),
  //     genSystem,
  //     name: name,
  //     generatorDescriptor,
  //     commandDescriptor,
  //   };

  //   // console.trace('processGenerator: context', context)

  //   const runResult = await context.commandDescriptor.runCommand(context);

  //   // TODO: Validate runResult with joi/jsonSchema

  //   console.log('runResult', runResult);
  // };

  // const runGenerator = async (opts: RunGeneratorOptions) => {
  //   await processGenerator(null, opts);
  // };

  const genSystem: IGeneratorsSystem = {
    isInitialized,
    initialize,
    ensureInitialized,
    getGeneratorDescriptor,
    listGenerators,
    runGenerator: async () => {},
  };

  return genSystem;
}
