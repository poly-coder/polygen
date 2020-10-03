import { LogLevel } from 'consola';

export type Variables = Readonly<Record<string, string>>;
export type GeneratorHelpers = Readonly<Record<string, any>>;

/********************
 *     Options      *
 ********************/

// Partial Options

export interface GlobalOptionsOnly {
  readonly configFile?: string;
  readonly logLevel: LogLevel;
  readonly version: string;
  readonly showOptions: boolean;
}

export interface SearchOptionsOnly {
  readonly name?: string;
  readonly tag?: string[];
}

export interface PrintOptionsOnly {
  readonly showBasePath?: boolean;
  readonly showSummary?: boolean;
  readonly showDetails?: boolean;
  readonly showCommands?: boolean;
}

export interface OutputOptionsOnly {
  readonly overwrite?: boolean;
  readonly outDir?: string;
}

export interface InitOptionsOnly {
  readonly searchPaths?: string[];
  readonly pcgenFolder?: string;
  readonly generatorFolder?: string;
  readonly commandsFolder?: string;
  readonly templatesFolder?: string;
  readonly defaultCommand?: string;
  readonly cwd?: string;
  readonly initAssets?: string;
}
export interface ListOptionsOnly {}

export interface InfoOptionsOnly {}

export interface RunOptionsOnly {
  readonly command?: string;
  readonly stepTag?: string[];
  readonly model?: string | any;
  readonly extendModel?: string[];
  readonly jsonPath?: string;
  readonly modelFormat?: string;
  readonly phases?: string;
  readonly dryRun: boolean;
  readonly stdout?: boolean;
  readonly applyModelArgs?: (model: any) => any;
}

// Required Partial Options

export interface RequiredGlobalOptionsOnly {
  readonly configFile: string;
  readonly logLevel: LogLevel;
  readonly version: string;
  readonly showOptions: boolean;
}

export interface RequiredSearchOptionsOnly {
  readonly name?: string;
  readonly tag: string[];
}

export interface RequiredPrintOptionsOnly {
  readonly showBasePath: boolean;
  readonly showSummary: boolean;
  readonly showDetails: boolean;
  readonly showCommands: boolean;
}

export interface RequiredOutputOptionsOnly {
  readonly overwrite?: boolean;
  readonly outDir: string;
}

export interface RequiredInitOptionsOnly {
  readonly searchPaths: string[];
  readonly pcgenFolder: string;
  readonly generatorFolder: string;
  readonly commandsFolder: string;
  readonly templatesFolder: string;
  readonly defaultCommand: string;
  readonly cwd: string;
  readonly initAssets: string;
}
export interface RequiredListOptionsOnly {}

export interface RequiredInfoOptionsOnly {}

export interface RequiredRunOptionsOnly {
  readonly command: string;
  readonly stepTag: string[];
  readonly model?: string | any;
  readonly extendModel?: string[];
  readonly jsonPath?: string;
  readonly modelFormat?: string;
  readonly phases: string;
  readonly dryRun: boolean;
  readonly stdout: boolean;
  readonly applyModelArgs?: (model: any) => any;
}

// User Options

export interface InitOptions
  extends InitOptionsOnly,
    GlobalOptionsOnly,
    OutputOptionsOnly {}

export interface ListOptions
  extends ListOptionsOnly,
    GlobalOptionsOnly,
    SearchOptionsOnly,
    PrintOptionsOnly {}

export interface InfoOptions
  extends InfoOptionsOnly,
    GlobalOptionsOnly,
    SearchOptionsOnly,
    PrintOptionsOnly {}

export interface RunOptions
  extends RunOptionsOnly,
    GlobalOptionsOnly,
    SearchOptionsOnly,
    OutputOptionsOnly {}

// Required Options

export interface RequiredInitOptions
  extends RequiredInitOptionsOnly,
    RequiredGlobalOptionsOnly,
    RequiredOutputOptionsOnly {}

export interface RequiredListOptions
  extends RequiredListOptionsOnly,
    RequiredGlobalOptionsOnly,
    RequiredSearchOptionsOnly,
    RequiredPrintOptionsOnly {}

export interface RequiredInfoOptions
  extends RequiredInfoOptionsOnly,
    RequiredGlobalOptionsOnly,
    RequiredSearchOptionsOnly,
    RequiredPrintOptionsOnly {}

export interface RequiredRunOptions
  extends RequiredRunOptionsOnly,
    RequiredGlobalOptionsOnly,
    RequiredSearchOptionsOnly,
    RequiredOutputOptionsOnly {}

/******************************
 *     Configuration File     *
 ******************************/

export interface IModelLoaderConfig {
  readonly name: string;
  readonly extensions?: string[];

  readonly fromContent?: (content: string) => Promise<any | undefined>;
  readonly fromPath?: (path: string) => Promise<any | undefined>;
}

export interface IModelLoaders {
  readonly loadModelFromContent: (
    content: string,
    loaderName: string,
    isOptional?: boolean | undefined,
    replaceVariables?: boolean | undefined
  ) => Promise<any | undefined>;

  readonly loadModelFromPath: (
    filePath: string,
    loaderName?: string | undefined,
    isOptional?: boolean | undefined,
    replaceVariables?: boolean | undefined
  ) => Promise<any | undefined>;
}

export interface ITemplateRunnerConfig {
  readonly name: string;
  readonly extensions?: string[];

  readonly fromContent?: (
    content: string,
    context: any,
    engineOptions?: any
  ) => Promise<string | undefined>;

  readonly fromPath?: (
    path: string,
    context: any,
    engineOptions?: any
  ) => Promise<string | undefined>;
}

export interface ITemplateRunners {
  readonly renderTemplateFromContent: (
    content: string,
    context: any,
    loaderName: string,
    engineOptions?: any
  ) => Promise<string | undefined>;

  readonly renderTemplateFromPath: (
    filePath: string,
    context: any,
    loaderName?: string,
    engineOptions?: any
  ) => Promise<string | undefined>;
}

export interface IConfigurationFile extends InitOptionsOnly, OutputOptionsOnly {
  readonly useDefaultModelLoaders?: boolean;
  readonly useDefaultTemplateRunners?: boolean;
  readonly modelLoaders?: IModelLoaderConfig[];
  readonly templateRunners?: ITemplateRunnerConfig[];
}

export interface IConfiguration extends RequiredInitOptionsOnly, IModelLoaders, ITemplateRunners {
  readonly atCWD: (...paths: string[]) => string;
  readonly atBasePath: (...paths: string[]) => string;
  readonly atOutDir: (...paths: string[]) => string;

  readonly variables: Variables;
}

/***********************************
 *     Generators and Commands     *
 ***********************************/

export type ModelDetails = Record<string, string>;

export interface IGeneratorModelFile extends OutputOptionsOnly {
  defaultCommandMode?: string;
  defaultCommand?: string;
  caption?: string;
  summary?: string;
  details?: ModelDetails;
  tags?: string[];
  defaultEngine?: string;
  defaultEngineOptions?: any;
  commands: ICommandModel[];
}

export interface ICommandModel {
  name: string;
  module?: string;
  folder?: string;
  caption?: string;
  summary?: string;
  details?: ModelDetails;
}

export type CommandMode = 'folder' | 'module';

export interface IOperationBase {
  readonly variables: Variables;
  readonly configuration: IConfiguration;
}

export interface IGenerator extends IOperationBase {
  readonly name: string;
  readonly basePath: string;
  readonly defaultCommandMode: CommandMode;
  readonly caption?: string;
  readonly summary?: string;
  readonly details?: ModelDetails;
  readonly tags: string[];
  readonly defaultEngine?: string;
  readonly defaultEngineOptions?: string;

  readonly getCommands: () => Promise<ICommand[] | undefined>;
  readonly getCommand: (name: string) => Promise<ICommand | undefined>;
  readonly atGenerator: (...paths: string[]) => string;
  readonly atTemplates: (...paths: string[]) => string;
  readonly atCommands: (...paths: string[]) => string;
}

export interface ICommand extends IOperationBase {
  readonly name: string;
  readonly commandMode: CommandMode;
  readonly caption?: string;
  readonly summary?: string;
  readonly details?: ModelDetails;

  readonly generator: IGenerator;

  readonly createSteps: (
    context: IGeneratorContext
  ) => Promise<ICommandResult | undefined>;

  // readonly atTemplates: (...paths: string[]) => string;
}

/***********************************
 *             Runtime             *
 ***********************************/

export interface ICommandStepBase {
  readonly tags?: string[];
  readonly skip?: boolean;
  readonly overwrite?: boolean;
}

export interface CopyCommandStep extends ICommandStepBase {
  readonly type: 'copy';
  readonly from: string;
  readonly to: string;
}

export interface TemplateCommandStepBase extends ICommandStepBase {
  readonly from: string;
  readonly engine?: string;
  readonly engineOptions?: any;
  readonly model?: any | string;
  readonly modelFormat?: string;
  readonly jsonPath?: string;
}

export interface TemplateCommandStep extends TemplateCommandStepBase {
  readonly type: 'template';
  readonly to: string;
}

export interface SnippetCommandStep extends TemplateCommandStepBase {
  readonly type: 'template';
  readonly to: string;
  readonly start?: string;
  readonly end?: string;
  readonly startRegExp?: string;
  readonly endRegExp?: string;
}

export interface GeneratorCommandStep extends ICommandStepBase, RunOptions {
  readonly type: 'generator';
}

export type CommandStep =
  | CopyCommandStep
  | TemplateCommandStep
  | SnippetCommandStep
  | GeneratorCommandStep;

export interface ICommandResult {
  readonly steps: CommandStep[];
}

export interface ICommandStep extends IOperationBase {
  readonly definition: CommandStep;
  readonly command: ICommand;
}

export interface IGeneratorFileSystem {
  readonly fileExists: (filePath: string) => Promise<boolean>;
  readonly readFile: (filePath: string) => Promise<string | undefined>;
  readonly writeFile: (filePath: string, content: string) => void;
}

export interface IOperationRuntimeBase {
  readonly options: RequiredRunOptions;
  readonly configuration: IConfiguration;
  readonly fileSystem: IGeneratorFileSystem;
}

export interface IGeneratorRuntime extends IOperationRuntimeBase {
  readonly type: 'generator';
  readonly generator: IGenerator;
}

export interface ICommandRuntime extends IOperationRuntimeBase {
  readonly type: 'command';
  readonly generator: IGenerator;
  readonly command: ICommand;
}

export interface IStepRuntime extends IOperationRuntimeBase {
  readonly type: 'step';
  readonly generator: IGenerator;
  readonly command: ICommand;
  readonly step: ICommandStep;
}

export type OperationRuntime = IGeneratorRuntime | ICommandRuntime | IStepRuntime;

export interface IGeneratorContext {
  readonly parent: IGeneratorContext | undefined;
  readonly self: IGeneratorContext;
  readonly name: string;
  readonly model?: any;
  readonly h: GeneratorHelpers;
  readonly vars: Variables;
  readonly runtime: OperationRuntime;
}
