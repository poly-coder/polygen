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
  sprintGoodList,
  sprintInfo,
  sprintWarn,
} from './logging';
import { matchTags, searchGenerators } from './searching';
import {
  CommandStep,
  CopyCommandStep,
  GeneratorCommandStep,
  ICommand,
  ICommandContext,
  ICommandStep,
  IConfiguration,
  IGenerator,
  IGeneratorContext,
  IGeneratorFileSystem,
  IOperationContext,
  IStepContext,
  RunOptions,
  SnippetCommandStep,
  TemplateCommandStep,
  ValueOrParam1Func,
} from './types';

async function getValue1<T, P>(
  valueOrFunc: ValueOrParam1Func<T, P>,
  p: P
): Promise<T> {
  if (typeof valueOrFunc === 'function') {
    return await (valueOrFunc as any)(p);
  }
  return valueOrFunc;
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

function createFileSystem(configuration: IConfiguration): InternalFileSystem {
  const INDENT = '    ';

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

  const getNormalizedPath = (filePath: string) => path.normalize(filePath);

  const getFullPath = (normalizedPath: string) =>
    path.resolve(configuration.atCWD(normalizedPath));

  const getFilePaths = (filePath: string): [string, string] => {
    const normalizedPath = getNormalizedPath(filePath);
    return [normalizedPath, getFullPath(normalizedPath)];
  };

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

async function executeStep(
  name: string,
  startMessage: string,
  stepDefinition: CommandStep,
  parentContext: ICommandContext,
  createModel: () => Promise<any>,
  action: (context: IStepContext) => Promise<number>
): Promise<number> {
  const logPrefix = createLogPrefix(name);

  consola.trace(`${logPrefix}: [Start] ${startMessage}`);

  const model = await createModel();

  const stepContext = createStepContext(stepDefinition, parentContext, model);

  const iterations: IStepContext[] = stepDefinition.each
    ? (await stepDefinition.each(stepContext)).map((result) =>
        result ? { ...stepContext, ...result } : stepContext
      )
    : [stepContext];

  for (const context of iterations) {
    if (stepDefinition.if && !(await stepDefinition.if(context))) {
      continue;
    }

    const result = await action(context);

    if (result !== 0) {
      return result;
    }
  }

  return 0;
}

function executeCopyStep(
  stepDefinition: CopyCommandStep,
  parentContext: ICommandContext
): Promise<number> {
  return executeStep(
    'executeCopyStep',
    `'${
      typeof stepDefinition.from === 'string' ? stepDefinition.from : '...'
    }' to '${
      typeof stepDefinition.to === 'string' ? stepDefinition.to : '...'
    }'`,
    stepDefinition,
    parentContext,
    () => Promise.resolve(undefined),
    async (context) => {
      const toFile = await getValue1(stepDefinition.to, context);

      if (!(await shouldRunStep(stepDefinition, context, toFile))) {
        return 0;
      }

      const fromFile = await getValue1(stepDefinition.from, context);

      const sourcePath = context.generator.atTemplates(fromFile);

      const content = await context.fileSystem.readFile(sourcePath);

      if (!content) {
        consola.log(
          `File '${sprintBad(
            sourcePath
          )}' was not found to be copied to '${sprintGood(toFile)}'`
        );
        return -1;
      }

      const targetPath = context.command.atOutDir(toFile);

      context.fileSystem.writeFile(
        chalk`{green ${'Copy'}} from '{white ${sourcePath}}' to '{white ${targetPath}}'.`,
        targetPath,
        content
      );

      return 0;
    }
  );
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

function executeFileStep(
  stepDefinition: TemplateCommandStep,
  parentContext: ICommandContext
): Promise<number> {
  return executeStep(
    'executeFileStep',
    `'${
      typeof stepDefinition.from === 'string' ? stepDefinition.from : '...'
    }' to '${
      typeof stepDefinition.to === 'string' ? stepDefinition.to : '...'
    }'`,
    stepDefinition,
    parentContext,
    () =>
      loadModel(
        parentContext.model,
        stepDefinition,
        parentContext.command,
        parentContext,
        { isOptional: false, replaceVariables: false }
      ),
    async (context) => {
      const fromFile = await getValue1(stepDefinition.from, context);

      const toFile = await getValue1(stepDefinition.to, context);

      if (!(await shouldRunStep(stepDefinition, context, toFile))) {
        return 0;
      }

      const templatePath = context.generator.atTemplates(fromFile);

      const [engine, engineOptions] = searchStepEngine(context);

      const content = await context.configuration.renderTemplateFromPath(
        templatePath,
        context,
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

      const targetPath = context.command.atOutDir(toFile);

      context.fileSystem.writeFile(
        chalk`{green ${'Generated'}} '{white ${targetPath}}' from template '{white ${templatePath}}'.`,
        targetPath,
        content
      );

      return 0;
    }
  );
}

function isSubstringFoundAt(text: string, substring: string, index: number) {
  for (let i = 0; i < substring.length; i++) {
    if (text[index + i] !== substring[i]) {
      return false;
    }
  }
  return true;
}

function getDefaultBounds(
  text: string,
  fromPos?: number,
  beforePos?: number
): [number, number] {
  return [
    fromPos === undefined ? 0 : fromPos,
    beforePos === undefined ? text.length : beforePos,
  ];
}

function indexOfSubString(
  text: string,
  substring: string,
  fromPos?: number,
  beforePos?: number
) {
  [fromPos, beforePos] = getDefaultBounds(text, fromPos, beforePos);

  for (let index = fromPos; index < beforePos - substring.length; index++) {
    if (isSubstringFoundAt(text, substring, index)) {
      return index;
    }
  }

  return -1;
}

function lastIndexOfSubString(
  text: string,
  substring: string,
  fromPos?: number,
  beforePos?: number
) {
  [fromPos, beforePos] = getDefaultBounds(text, fromPos, beforePos);

  for (
    let index = beforePos - substring.length - 1;
    index >= fromPos;
    index--
  ) {
    if (isSubstringFoundAt(text, substring, index)) {
      return index;
    }
  }

  return -1;
}

function nextSubstringPos(
  text: string,
  substrings: string[],
  fromPos?: number,
  beforePos?: number
): [number, string] {
  let atPos = -1;
  let found: string = '';
  for (const substring of substrings) {
    const pos = indexOfSubString(text, substring, fromPos, beforePos);
    if (pos >= 0 && (atPos === -1 || pos < atPos)) {
      atPos = pos;
      found = substring;
    }
  }
  return [atPos, found];
}

function lastSubstringPos(
  text: string,
  substrings: string[],
  fromPos?: number,
  beforePos?: number
): [number, string] {
  let atPos = -1;
  let found: string = '';
  for (const substring of substrings) {
    const pos = lastIndexOfSubString(text, substring, fromPos, beforePos);
    if (
      pos >= 0 &&
      (atPos === -1 || pos + substring.length > atPos + found.length)
    ) {
      atPos = pos;
      found = substring;
    }
  }
  return [atPos, found];
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
    return undefined;
  }

  if (index === -1) {
    return undefined;
  }

  // Look for line start and end
  const [prevNewLinePos, prevNewLine] = lastSubstringPos(
    container,
    ['\r\n', '\r', '\n'],
    0,
    index
  );

  const [nextNewLinePos, nextNewLine] = nextSubstringPos(
    container,
    ['\r\n', '\r', '\n'],
    index + length
  );

  if (prevNewLinePos >= 0) {
    length += index - prevNewLinePos - prevNewLine.length;
    index = prevNewLinePos + prevNewLine.length;
  }

  if (nextNewLinePos >= 0) {
    length = nextNewLinePos + nextNewLine.length - index;
  }

  return [index, length];
};

function executeSnippetStep(
  stepDefinition: SnippetCommandStep,
  parentContext: ICommandContext
): Promise<number> {
  return executeStep(
    'executeSnippetStep',
    `'${
      typeof stepDefinition.from === 'string' ? stepDefinition.from : '...'
    }' to '${
      typeof stepDefinition.to === 'string' ? stepDefinition.to : '...'
    }'`,
    stepDefinition,
    parentContext,
    () =>
      loadModel(
        parentContext.model,
        stepDefinition,
        parentContext.command,
        parentContext,
        { isOptional: false, replaceVariables: false }
      ),
    async (context) => {
      const fromFile = await getValue1(stepDefinition.from, context);

      const toFile = await getValue1(stepDefinition.to, context);

      if (!(await shouldRunStep(stepDefinition, context))) {
        return 0;
      }

      const targetPath = context.command.atOutDir(toFile);

      const targetContent = await context.fileSystem.readFile(targetPath);

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

      if (!startPositions) {
        if (!stepDefinition.start && !stepDefinition.startRegExp) {
          consola.log(
            `Snippet steps have to specify both start and end boundaries: from '${stepDefinition.from}' to '${stepDefinition.to}'.`
          );
        } else {
          consola.log(
            `Didn't found the boundaries for snippet insertion: from '${
              stepDefinition.from
            }' to '${stepDefinition.to}'. Start: '${
              stepDefinition.start ?? stepDefinition.startRegExp
            }'`
          );
        }
        return -1;
      }

      const endPositions = findContainerPosition(
        targetContent,
        stepDefinition.end,
        stepDefinition.endRegExp
      );

      if (!endPositions) {
        if (!stepDefinition.end && !stepDefinition.endRegExp) {
          consola.log(
            `Snippet steps have to specify both end and end boundaries: from '${stepDefinition.from}' to '${stepDefinition.to}'.`
          );
        } else {
          consola.log(
            `Didn't found the boundaries for snippet insertion: from '${
              stepDefinition.from
            }' to '${stepDefinition.to}'. End: '${
              stepDefinition.end ?? stepDefinition.endRegExp
            }'`
          );
        }
        return -1;
      }

      const [startIndex, startLength] = startPositions;
      const [endIndex] = endPositions;

      if (endIndex < startIndex + startLength) {
        consola.log(
          `Found snippet boundaries in the wrong position. ` +
            `endIndex [${endIndex}] < startIndex [${startIndex}] + startLength [${startLength}]`
        );
        return -1;
      }

      const templatePath = context.generator.atTemplates(fromFile);

      const [engine, engineOptions] = searchStepEngine(context);

      const snippetContent = await context.configuration.renderTemplateFromPath(
        templatePath,
        context,
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

      context.fileSystem.writeFile(
        chalk`{green ${'Patched'}} '{white ${targetPath}}' from snippet '{white ${templatePath}}'.`,
        targetPath,
        content
      );

      return 0;
    }
  );
}

function firstDefined<T>(defaultValue: T, ...args: (T | undefined)[]): T {
  for (const value of args) {
    if (value !== undefined) {
      return value;
    }
  }
  return defaultValue;
}

function firstTrue(
  defaultValue: boolean,
  ...args: (boolean | undefined)[]
): boolean {
  for (const value of args) {
    if (value === true) {
      return true;
    }
  }
  return defaultValue;
}

function firstFalse(
  defaultValue: boolean,
  ...args: (boolean | undefined)[]
): boolean {
  for (const value of args) {
    if (value === false) {
      return false;
    }
  }
  return defaultValue;
}

function executeGeneratorStep(
  stepDefinition: GeneratorCommandStep,
  parentContext: ICommandContext
): Promise<number> {
  const generator =
    stepDefinition.generator ?? parentContext.generator.generatorName;
  const command = stepDefinition.command ?? parentContext.command.name;

  return executeStep(
    'executeGeneratorStep',
    `${generator}:${command}`,
    stepDefinition,
    parentContext,
    () =>
      loadModel(
        parentContext.model,
        stepDefinition,
        parentContext.command,
        parentContext,
        { isOptional: false, replaceVariables: false }
      ),
    async (context) => {
      if (!(await shouldRunStep(stepDefinition, context))) {
        return 0;
      }

      const runOptions = requiredRunOptions({
        dryRun: firstTrue(false, context.options.dryRun, stepDefinition.dryRun),
        logLevel: firstDefined(
          context.options.logLevel,
          stepDefinition.logLevel
        ),
        showOptions: false,
        version: context.options.version,
        command,
        generator,
        configFile: firstDefined(
          undefined,
          stepDefinition.configFile,
          context.options.configFile
        ),
        jsonPath: stepDefinition.jsonPath,
        model: firstDefined(undefined, stepDefinition.model, context.model),
        modelFormat: stepDefinition.modelFormat,
        name: firstDefined(undefined, stepDefinition.name, context.name),
        outDir: firstDefined('.', stepDefinition.outDir, context.command.outDir),
        overwrite: firstFalse(
          true,
          context.options.overwrite,
          stepDefinition.dryRun
        ),
        stdout: firstTrue(
          false,
          stepDefinition.stdout,
          context.options.overwrite
        ),
        stepTag: stepDefinition.stepTag,
        tag: stepDefinition.tag,
      });

      return await findAndExecuteGenerator({
        ...context,
        options: runOptions,
      });
    }
  );
}

async function createCommandContext(
  command: ICommand,
  parentContext: IGeneratorContext
): Promise<ICommandContext> {
  const commandContext: ICommandContext = {
    ...parentContext,
    type: 'command',
    parentContext,
    command,
    self: undefined as any,
    vars: command.variables,
    h: await command.createHelpers(),
  };

  return Object.assign(commandContext, { self: commandContext });
}

async function shouldRunStep(
  stepDefinition: CommandStep,
  stepContext: IStepContext,
  toFile?: string
) {
  if (stepDefinition.skip) {
    consola.trace(
      `Skipping '${sprintInfo(stepDefinition.type)} ${sprintGoodList(
        stepDefinition.stepTags ?? []
      )}' step. It is marked with 'skip: true'`
    );
    return false;
  }

  if (!matchTags(stepDefinition.stepTags, stepContext.options.stepTag)) {
    consola.trace(
      `Skipping '${sprintInfo(
        stepDefinition.type
      )}' step. It is marked with tags '${sprintBadList(
        stepDefinition.stepTags ?? []
      )}'`
    );
    return false;
  }

  if (!!toFile) {
    const toPath = stepContext.command.atOutDir(toFile);

    const fileExists = await stepContext.fileSystem.fileExists(toPath);

    if (fileExists) {
      const userOverwrite = stepContext.options.overwrite;

      if (userOverwrite === false) {
        stepContext.fileSystem.writeMessage(
          chalk`{cyan ${'Skip'}} generating to file '{white ${toPath}}'. {cyan User} indicated not to overwrite any file.`
        );
        return false;
      }

      const stepOverwrite =
        stepDefinition.overwrite !== undefined
          ? await getValue1(stepDefinition.overwrite, stepContext)
          : undefined;

      if (userOverwrite !== true && stepOverwrite === false) {
        stepContext.fileSystem.writeMessage(
          chalk`{cyan ${'Skip'}} generating to file '{white ${toPath}}'. {cyan Step} indicated not to overwrite this file.`
        );
        return false;
      }

      if (stepOverwrite !== true && userOverwrite !== true) {
        stepContext.fileSystem.writeMessage(
          chalk`{cyan ${'Skip'}} generating to file '{white ${toPath}}'. By default no files are overwritten.`
        );
        return false;
      }
    }
  }

  return true;
}

async function executeCommand(
  command: ICommand,
  parentContext: IGeneratorContext
): Promise<number> {
  const logPrefix = createLogPrefix('executeCommand');

  consola.trace(`${logPrefix}: [Start] '${command.name}'`);

  if (command.requireName && !parentContext.name) {
    consola.error(`This command requires you to set a 'name'`);
    return -1;
  }

  if (command.requireModel && !parentContext.model) {
    consola.error(`This command requires you to set a model`);
    return -1;
  }

  let commandContext = await createCommandContext(command, parentContext);

  const validationResult = await command.validateModel(
    commandContext.model,
    commandContext
  );

  if (
    validationResult === false ||
    validationResult === undefined ||
    validationResult === null
  ) {
    consola.error(`Given model did not pass the command's validation.`);
    return -1;
  } else if (validationResult === true) {
    // Do nothing
  } else if (typeof validationResult === 'string') {
    if (validationResult !== '') {
      consola.error(`Invalid model: ` + validationResult);
      return -1;
    }
  } else if (typeof validationResult === 'object') {
    commandContext = { ...commandContext, model: validationResult };
  } else {
    consola.error(`Given model did not pass the command's validation.`);
    return -1;
  }

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
          const result = await executeFileStep(stepDefinition, commandContext);
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

      case 'generator':
        {
          const result = await executeGeneratorStep(
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
            (stepDefinition as any).type
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
    h: generator.createHelpers(),
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
  generator: IGenerator,
  context: IOperationContext
): Promise<number> {
  const logPrefix = createLogPrefix('executeRunGenerator');

  consola.trace(`${logPrefix}: [Start] '${generator.generatorName}'`);

  const model = await loadModel(
    undefined,
    context.options,
    generator,
    context,
    {
      isOptional: false,
      replaceVariables: false,
    }
  );

  const rootContext: IOperationContext = {
    ...context,
    model,
  };

  const result = await executeGenerator(generator, rootContext);

  if (result !== 0) {
    return result;
  }

  return 0;
}

async function findAndExecuteGenerator(
  context: IOperationContext
): Promise<number> {
  const generators = await searchGenerators(
    context.configuration,
    context.options
  );

  if (generators.length === 0) {
    consola.log(`There are no generators to show with given criteria.`);
    return -1;
  }

  if (generators.length > 1) {
    consola.log(`{yellow There are multiple generators with given criteria}`);
  }

  const result = await executeRunGenerator(generators[0], context);

  return result;
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

  const fileSystem = createFileSystem(configuration);

  const helpers = await configuration.createHelpers();

  const context: IOperationContext = {
    configuration,
    options: runOptions,
    vars: configuration.variables,
    name: runOptions.name,
    h: helpers,
    fileSystem: fileSystem.fileSystem,
    console: consola,
  };

  const result = await findAndExecuteGenerator(context);

  if (result !== 0) {
    return;
  }

  await fileSystem.execute(runOptions.dryRun, runOptions.stdout);
}
