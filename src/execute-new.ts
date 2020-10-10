import chalk from 'chalk';
import consola from 'consola';
import path from 'path';
import {
  applyGlobalOptions,
  createConfiguration,
  loadConfigurationFile,
  loadModel,
} from './configuration';
import { requiredRunOptions } from './defaults';
import {
  fsExistsAsFile,
  fsReadFileContent,
  fsWriteFileContent,
} from './file-utils';
import {
  createLogPrefix,
  sprintBad,
  sprintBadList,
  sprintGood,
  sprintInfo,
  sprintWarn,
} from './logging';
import { matchTags, searchGenerators } from './searching';
import {
  CommandStep,
  CopyCommandStep,
  ICommand,
  ICommandContext,
  ICommandStep,
  IGenerator,
  IGeneratorContext,
  IGeneratorFileSystem,
  IOperationContext,
  IStepContext,
  RequiredRunOptions,
  RunOptions,
  SnippetCommandStep,
  TemplateCommandStep,
} from './types';

async function createHelpers() {
  return {
    case: (await import('change-case')).default,
    inflection: (await import('inflection')).default,
    humanize: (await import('humanize-plus')).default,
    // Add from configuration/generator: lodash, underscore, rambda, ...
  };
}

interface InternalFileSystem {
  readonly fileSystem: IGeneratorFileSystem;
  readonly execute: (dryRun: boolean, stdout: boolean) => Promise<number>;
}

interface IFileSystemOperation {
  readonly message: string;
}

interface FileSystemMessage extends IFileSystemOperation {
  readonly type: 'message';
}

interface FileSystemScope extends IFileSystemOperation {
  readonly type: 'scope';
  indent: string;
  endMessage?: string;
  operations: FileSystemOperation[];
}

type FileSystemOperation = FileSystemMessage | FileSystemScope;

function createFileSystem(generator: IGenerator): InternalFileSystem {
  const INDENT = '    ';
  const configuration = generator.configuration;

  const logPrefix = createLogPrefix('fileSystem');

  const fileMap = new Map<string, string>();

  let scopes: FileSystemScope[] = [
    {
      type: 'scope',
      message: '',
      indent: '',
      operations: [],
    },
  ];

  const getNormalizedPath = (filePath: string) => 
    path.normalize(filePath);

  const getFullPath = (normalizedPath: string) => 
    path.resolve(configuration.atCWD(normalizedPath));

  const getFilePaths = (filePath: string): [string, string] => {
    const normalizedPath = getNormalizedPath(filePath);
    return [normalizedPath, getFullPath(normalizedPath)];
  }

  const fileExists = async (filePath: string) => {
    const [normalizedPath, fullPath] = getFilePaths(filePath);

    if (fileMap.has(normalizedPath)) {
      return true;
    }

    return await fsExistsAsFile(fullPath);
  };

  const readFile = async (filePath: string) => {
    const [normalizedPath, fullPath] = getFilePaths(filePath);

    const content = fileMap.get(normalizedPath);
    if (content !== undefined) {
      consola.trace(
        `${logPrefix}:readFile '${normalizedPath}' from FILE MAP with ${content.length} bytes`
      );
      return content;
    }

    const fileContent = await fsReadFileContent(fullPath);

    if (fileContent) {
      consola.trace(
        `${logPrefix}:readFile '${normalizedPath}' from CWD with ${fileContent.length} bytes`
      );
    } else {
      consola.trace(`${logPrefix}:readFile '${normalizedPath}' NOT FOUND`);
    }

    return fileContent;
  };

  const writeFile = (message: string, filePath: string, content: string) => {
    const normalizedPath = getNormalizedPath(filePath);

    consola.trace(
      `${logPrefix}:writeFile '${normalizedPath}' with ${content.length} bytes`
    );

    fileMap.set(normalizedPath, content);

    scopes[0].operations.push({
      type: 'message',
      message: scopes[0].indent + message,
    });
  };

  const writeMessage = (message: string) => {
    scopes[0].operations.push({
      type: 'message',
      message: scopes[0].indent + message,
    });
  };

  const beginScope = (message: string, endMessage?: string) => {
    consola.trace(`${logPrefix}:beginScope '${message}'`);

    const scope: FileSystemScope = {
      type: 'scope',
      message: scopes[0].indent + message,
      endMessage: endMessage ? scopes[0].indent + endMessage : undefined,
      indent: scopes[0].indent + INDENT,
      operations: [],
    };

    scopes[0].operations.push(scope);

    scopes.unshift(scope);

    return function () {
      if (scopes[0] !== scope) {
        consola.trace(
          `${logPrefix}:endScope Scope '${message}' is already closed`
        );
      }

      scopes.shift();
    };
  };

  const writeFileContents = async (dryRun: boolean, stdout: boolean) => {
    if (dryRun) {
      consola.log(
        `Dry Run: This operation will not write anything to persistent storage`
      );
    }

    for (const [normalizedPath, content] of fileMap.entries()) {
      const fullPath = getFullPath(normalizedPath);
      const alreadyExists = await fsExistsAsFile(fullPath);

      if (alreadyExists) {
        consola.trace(
          `${logPrefix}: execute Overwriting file '${sprintWarn(
            fullPath
          )}' with ${content.length} bytes`
        );
      } else {
        consola.trace(
          `${logPrefix}: execute Creating file '${sprintGood(fullPath)}' with ${
            content.length
          } bytes`
        );
      }

      if (!dryRun) {
        await fsWriteFileContent(fullPath, content);
      }

      if (stdout) {
        if (alreadyExists) {
          consola.log(sprintWarn('-'.repeat(fullPath.length + 8)));
          consola.log(sprintWarn(`-   ${fullPath}   -`));
          consola.log(sprintWarn('-'.repeat(fullPath.length + 8)));
        } else {
          consola.log(sprintGood('-'.repeat(fullPath.length + 8)));
          consola.log(sprintGood(`-   ${fullPath}   -`));
          consola.log(sprintGood('-'.repeat(fullPath.length + 8)));
        }
        process.stdout.write(content);
        process.stdout.write('\n');
      }
    }
  };

  const printScope = (scope: FileSystemScope) => {
    if (scope.message) {
      consola.log(scope.message);
    }

    for (const operation of scope.operations) {
      if (operation.type === 'message') {
        consola.log(operation.message);
      } else {
        printScope(operation);
      }
    }

    if (scope.endMessage) {
      consola.log(scope.endMessage);
    }
  };

  const execute = async (dryRun: boolean, stdout: boolean) => {
    if (scopes.length > 1) {
      consola.trace(
        `${logPrefix}:execute Some scopes were kept open: '${scopes[0].message}'`
      );
    }

    const scope = scopes[scopes.length - 1];

    await writeFileContents(dryRun, stdout);

    printScope(scope);

    return 0;
  };

  return {
    fileSystem: {
      fileExists,
      readFile,
      writeFile,
      writeMessage,
      beginScope,
    },
    execute,
  };
}

function createStepContext(
  stepDefinition: CommandStep,
  parentContext: ICommandContext,
  model?: any | undefined
): IStepContext {
  const step: ICommandStep = {
    definition: stepDefinition,
    command: parentContext.command,
    configuration: parentContext.configuration,
    variables: parentContext.command.variables,
  };

  const stepContext: IStepContext = {
    ...parentContext,
    type: 'step',
    parentContext,
    step,
    model: model ?? parentContext.model,
    self: undefined as any,
    vars: step.variables,
    h: {
      ...parentContext.h,
      vars: step.variables,
    },
  };

  return Object.assign(stepContext, { self: stepContext });
}

async function executeCopyStep(
  stepDefinition: CopyCommandStep,
  parentContext: ICommandContext
): Promise<number> {
  const logPrefix = createLogPrefix('executeCopyStep');

  consola.trace(
    `${logPrefix}: [Start] '${stepDefinition.from}' to '${stepDefinition.to}'`
  );

  const stepContext = createStepContext(stepDefinition, parentContext);

  const sourcePath = stepContext.generator.atTemplates(stepDefinition.from);

  const content = await stepContext.fileSystem.readFile(sourcePath);

  if (!content) {
    consola.log(
      `File '${sprintBad(
        sourcePath
      )}' was not found to be copied to '${sprintGood(stepDefinition.to)}'`
    );
    return -1;
  }

  const targetPath = stepContext.command.atOutDir(stepDefinition.to);

  stepContext.fileSystem.writeFile(
    chalk`{green ${'Copy'}} from '{white ${sourcePath}}' to '{white ${targetPath}}'.`,
    targetPath,
    content
  );

  return 0;
}

function searchStepEngine(
  stepContext: IStepContext
): [string | undefined, any | undefined] {
  // Search in
  // 1- Step
  // 2- Command
  // 3- Generator
  function gatherOptions() {
    const combinations: [string | undefined, any | undefined][] = [];

    const stepDefinition = stepContext.step.definition;
    if ('engine' in stepDefinition || 'engineOptions' in stepDefinition) {
      combinations.push([stepDefinition.engine, stepDefinition.engineOptions]);
    }

    combinations.push([
      stepContext.command.engine,
      stepContext.command.engineOptions,
    ]);
    combinations.push([
      stepContext.generator.defaultEngine,
      stepContext.generator.defaultEngineOptions,
    ]);

    return combinations;
  }

  const combinations = gatherOptions();

  // Engine is the first between step, command, generator that specify an engine
  const engine = combinations.find(([e]) => !e)?.[0];
  // Engine Options is the first that matches the same engine selected before
  const engineOptions = engine
    ? combinations.find(([e, o]) => e === engine && !o)?.[1]
    : combinations.find(([_, o]) => !o)?.[1];

  return [engine, engineOptions];
}

async function executeTemplateStep(
  stepDefinition: TemplateCommandStep,
  parentContext: ICommandContext
): Promise<number> {
  const logPrefix = createLogPrefix('executeTemplateStep');

  consola.trace(
    `${logPrefix}: [Start] '${stepDefinition.from}' to '${stepDefinition.to}'`
  );

  const model = await loadModel(
    parentContext.model,
    stepDefinition,
    parentContext.command,
    parentContext,
    { isOptional: false, replaceVariables: false }
  );

  const stepContext = createStepContext(stepDefinition, parentContext, model);

  const templatePath = stepContext.generator.atTemplates(stepDefinition.from);

  const [engine, engineOptions] = searchStepEngine(stepContext);

  const content = await stepContext.configuration.renderTemplateFromPath(
    templatePath,
    stepContext,
    { engine, engineOptions }
  );

  if (content === undefined) {
    consola.log(
      `Failed using template '${sprintBad(
        templatePath
      )}' with engine '${sprintBad(engine)}'`
    );
    return -1;
  }

  const targetPath = stepContext.command.atOutDir(stepDefinition.to);

  stepContext.fileSystem.writeFile(
    chalk`{green ${'Generated'}} '{white ${targetPath}}' from template '{white ${templatePath}}'.`,
    targetPath,
    content
  );

  return 0;
}

const findContainerPosition = (
  container: string,
  searchText: string | undefined,
  searchExpr: string | undefined
): [number, number] | undefined => {
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
    consola.log(`Snippet steps have to specify both start and end boundaries`);
    return undefined;
  }

  if (index === -1) {
    consola.log(`Didn't found the boundaries for snippet insertion`);
    return undefined;
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

async function executeSnippetStep(
  stepDefinition: SnippetCommandStep,
  parentContext: ICommandContext
): Promise<number> {
  const logPrefix = createLogPrefix('executeSnippetStep');

  consola.trace(
    `${logPrefix}: [Start] '${stepDefinition.from}' to '${stepDefinition.to}'`
  );

  const model = await loadModel(
    parentContext.model,
    stepDefinition,
    parentContext.command,
    parentContext,
    { isOptional: false, replaceVariables: false }
  );

  const stepContext = createStepContext(stepDefinition, parentContext, model);

  const targetPath = stepContext.command.atOutDir(stepDefinition.to);

  const targetContent = await stepContext.fileSystem.readFile(targetPath);

  if (targetContent === undefined) {
    consola.log(
      `File '${sprintBad(
        targetPath
      )}' does not exists, and snippets require to be inserted in existing files. Add a previous step to create the container file previous to the snippet step.`
    );
    return -1;
  }

  const startPositions = findContainerPosition(
    targetContent,
    stepDefinition.start,
    stepDefinition.startRegExp
  );
  const endPositions = findContainerPosition(
    targetContent,
    stepDefinition.start,
    stepDefinition.startRegExp
  );

  if (!startPositions || !endPositions) {
    return -1;
  }

  const [startIndex, startLength] = startPositions;
  const [endIndex] = endPositions;

  if (endIndex < startIndex + startLength) {
    consola.log(`Found snippet boundaries in the wrong position`);
    return -1;
  }

  const templatePath = stepContext.generator.atTemplates(stepDefinition.from);

  const [engine, engineOptions] = searchStepEngine(stepContext);

  const snippetContent = await stepContext.configuration.renderTemplateFromPath(
    templatePath,
    stepContext,
    { engine, engineOptions }
  );

  if (snippetContent === undefined) {
    consola.log(
      `Failed using template '${sprintBad(
        templatePath
      )}' with engine '${sprintBad(engine)}'`
    );
    return -1;
  }

  const startContent = targetContent.substring(0, startIndex + startLength);
  const endContent = targetContent.substring(endIndex);
  const content = startContent + snippetContent + endContent;

  stepContext.fileSystem.writeFile(
    chalk`{green ${'Patched'}} '{white ${targetPath}}' from snippet '{white ${templatePath}}'.`,
    targetPath,
    content
  );

  return 0;
}

function createCommandContext(
  command: ICommand,
  parentContext: IGeneratorContext
): ICommandContext {
  const commandContext: ICommandContext = {
    ...parentContext,
    type: 'command',
    parentContext,
    command,
    self: undefined as any,
    vars: command.variables,
    h: {
      ...parentContext.h,
      vars: command.variables,
    },
  };

  return Object.assign(commandContext, { self: commandContext });
}

async function shouldSkipStep(
  stepDefinition: CommandStep,
  commandContext: ICommandContext
) {
  if (stepDefinition.skip) {
    consola.trace(
      `Skipping '${sprintInfo(
        stepDefinition.type
      )}' step. It is marked with 'skip:true'`
    );
    return true;
  }

  if (!matchTags(stepDefinition.stepTags, commandContext.options.stepTag)) {
    consola.trace(
      `Skipping '${sprintInfo(
        stepDefinition.type
      )}' step. It is marked with tags '${sprintBadList(
        stepDefinition.stepTags ?? []
      )}'`
    );
    return true;
  }

  if (
    'to' in stepDefinition &&
    (stepDefinition.overwrite === false ||
      commandContext.options.overwrite === false)
  ) {
    const toPath = commandContext.configuration.atOutDir(stepDefinition.to);
    if (await commandContext.fileSystem.fileExists(toPath)) {
      const who = stepDefinition.overwrite === false ? 'Step' : 'User';
      commandContext.fileSystem.writeMessage(
        chalk`{cyan ${'Skip'}} generating to file '{white ${toPath}}'. {cyan ${who}} indicated no overwrite.`
      );
    }

    return true;
  }

  return false;
}

async function executeCommand(
  command: ICommand,
  parentContext: IGeneratorContext
): Promise<number> {
  const logPrefix = createLogPrefix('executeCommand');

  consola.trace(`${logPrefix}: [Start] '${command.name}'`);

  const commandContext = createCommandContext(command, parentContext);

  const commandResult = await command.runCommand(commandContext);

  if (!commandResult) {
    consola.error(
      `Command '${sprintBad(command.name)}' for generator '${sprintGood(
        commandContext.generator.generatorName
      )}' return no result`
    );
    return -1;
  }

  for (const stepDefinition of commandResult.steps) {
    if (await shouldSkipStep(stepDefinition, commandContext)) {
      continue;
    }

    switch (stepDefinition.type) {
      case 'copy':
        {
          const result = await executeCopyStep(stepDefinition, commandContext);
          if (result !== 0) {
            return result;
          }
        }
        break;

      case 'file':
        {
          const result = await executeTemplateStep(
            stepDefinition,
            commandContext
          );
          if (result !== 0) {
            return result;
          }
        }
        break;

      case 'snippet':
        {
          const result = await executeSnippetStep(
            stepDefinition,
            commandContext
          );
          if (result !== 0) {
            return result;
          }
        }
        break;

      default:
        consola.log(
          `Unknown step type '${sprintBad(
            stepDefinition.type
          )}' found while executing '${sprintGood(
            `${commandContext.generator.generatorName}:${commandContext.command.name}`
          )}'`
        );
        return -1;
    }
  }

  return 0;
}

function createGeneratorContext(
  generator: IGenerator,
  parentContext: IOperationContext
): IGeneratorContext {
  const generatorContext: IGeneratorContext = {
    ...parentContext,
    type: 'generator',
    parentContext,
    generator,
    self: undefined as any,
    vars: generator.variables,
    h: {
      ...parentContext.h,
      vars: generator.variables,
    },
  };

  return Object.assign(generatorContext, { self: generatorContext });
}

async function executeGenerator(
  generator: IGenerator,
  parentContext: IOperationContext
): Promise<number> {
  const logPrefix = createLogPrefix('executeGenerator');

  consola.trace(`${logPrefix}: [Start] '${generator.generatorName}'`);

  const generatorContext = createGeneratorContext(generator, parentContext);

  const commandName =
    parentContext.options.command ?? parentContext.configuration.defaultCommand;

  const command = await generator.getCommand(commandName);

  if (!command) {
    consola.error(
      `Could not find command '${sprintBad(
        commandName
      )}' for generator '${sprintGood(generator.generatorName)}'`
    );
    return -1;
  }

  return await executeCommand(command, generatorContext);
}

async function executeRunGenerator(
  runOptions: RequiredRunOptions,
  generator: IGenerator
): Promise<number> {
  const logPrefix = createLogPrefix('executeRunGenerator');

  consola.trace(`${logPrefix}: [Start] '${generator.generatorName}'`);

  // Create starting context
  const configuration = generator.configuration;

  const helpers = {
    ...(await createHelpers()),
    env: process.env,
  };

  const fileSystem = createFileSystem(generator);

  const contextWithoutModel: IOperationContext = {
    configuration,
    options: runOptions,
    vars: configuration.variables,
    name: runOptions.name,
    h: helpers,
    fileSystem: fileSystem.fileSystem,
    console: consola,
  };

  const model = await loadModel(
    undefined,
    runOptions,
    generator,
    contextWithoutModel,
    { isOptional: false, replaceVariables: false }
  );

  const rootContext: IOperationContext = {
    ...contextWithoutModel,
    model,
  };

  const result = await executeGenerator(generator, rootContext);

  if (result !== 0) {
    return result;
  }

  return await fileSystem.execute(runOptions.dryRun, runOptions.stdout);
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

  await executeRunGenerator(runOptions, generators[0]);
}
