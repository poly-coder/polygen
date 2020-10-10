import { Consola, LogLevel } from 'consola';

export type Variables = Readonly<Record<string, string>>;
export type GeneratorHelpers = Readonly<Record<string, any>>;

/************************
 *     CLI Options      *
 ************************/

// Partial Options

export interface GlobalOptionsOnly {
  readonly configFile?: string;
  readonly logLevel: LogLevel;
  readonly version: string;
  readonly showOptions: boolean;
}

export interface SearchOptionsOnly {
  readonly generator?: string;
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

export interface LoadModelOptions {
  readonly model?: string | any;
  readonly modelFormat?: string;
  readonly jsonPath?: string;
  readonly applyModelArgs?: (model: any) => any;
}

export interface EngineConfigOptions {
  readonly engine?: string;
  readonly engineOptions?: any;
}

export interface RunOptionsOnly extends LoadModelOptions {
  readonly name?: string;
  readonly command?: string;
  readonly stepTag?: string[];
  readonly phases?: string;
  readonly dryRun: boolean;
  readonly stdout?: boolean;
}

// Required Partial Options

export interface RequiredGlobalOptionsOnly {
  readonly configFile: string;
  readonly logLevel: LogLevel;
  readonly version: string;
  readonly showOptions: boolean;
}

export interface RequiredSearchOptionsOnly {
  readonly generator?: string;
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
  readonly outDir?: string;
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

export interface RequiredRunOptionsOnly extends LoadModelOptions {
  readonly name?: string;
  readonly command: string;
  readonly stepTag: string[];
  readonly phases: string;
  readonly dryRun: boolean;
  readonly stdout: boolean;
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

/**************************************
 *     Plugins and Configurations     *
 **************************************/

export interface IFileLocator {
  readonly outDir: string;
  readonly atCWD: (...paths: string[]) => string;
  readonly atBasePath: (...paths: string[]) => string;
  readonly atOutDir: (...paths: string[]) => string;
}

export interface IModelLoaderConfig {
  readonly name: string;
  readonly extensions?: string[];

  readonly fromContent?: (content: string) => Promise<any | undefined>;
  readonly fromPath?: (path: string) => Promise<any | undefined>;
}

export interface LoadModelFromOptions {
  readonly isOptional?: boolean;
  readonly replaceVariables?: boolean;
}

export interface LoadModelFromContentOptions extends LoadModelFromOptions {
  readonly loaderName: string;
}

export interface LoadModelFromPathOptions extends LoadModelFromOptions {
  readonly loaderName?: string;
}

export interface IModelLoaders extends IFileLocator {
  readonly loadModelFromContent: (
    content: string,
    options: LoadModelFromContentOptions
  ) => Promise<any | undefined>;

  readonly loadModelFromPath: (
    filePath: string,
    options?: LoadModelFromPathOptions
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

export interface RenderTemplateFromContentOptions {
  readonly engine: string;
  readonly engineOptions?: any;
}

export interface RenderTemplateFromPathOptions {
  readonly engine?: string;
  readonly engineOptions?: any;
}

export interface ITemplateRunners extends IFileLocator {
  readonly renderTemplateFromContent: (
    content: string,
    context: any,
    options: RenderTemplateFromContentOptions
  ) => Promise<string | undefined>;

  readonly renderTemplateFromPath: (
    filePath: string,
    context: any,
    options?: RenderTemplateFromPathOptions
  ) => Promise<string | undefined>;
}

export interface IPlugginExtensions {
  readonly modelLoaders?: IModelLoaderConfig[];
  readonly templateRunners?: ITemplateRunnerConfig[];
}

/******************************
 *     Configuration Files     *
 ******************************/

export interface IConfigurationFile
  extends InitOptionsOnly,
    OutputOptionsOnly,
    IPlugginExtensions {
  readonly loadDefaultPlugins?: boolean;
}

export type ModelDetails = Record<string, string>;

export interface IGeneratorModelFile
  extends OutputOptionsOnly,
    IPlugginExtensions {
  readonly defaultCommandMode?: string;
  readonly defaultCommand?: string;
  readonly caption?: string;
  readonly summary?: string;
  readonly details?: ModelDetails;
  readonly tags?: string[];
  readonly defaultEngine?: string;
  readonly defaultEngineOptions?: any;
  readonly commands: ICommandModel[];
}

export interface ICommandModel extends IPlugginExtensions {
  readonly name: string;
  readonly module?: string;
  readonly folder?: string;
  readonly caption?: string;
  readonly summary?: string;
  readonly details?: ModelDetails;
  readonly requireName?: boolean;
  readonly requireModel?: boolean;
}

/***********************************
 *      Configuration Runtime      *
 ***********************************/

export interface IConfiguration
  extends RequiredInitOptionsOnly,
    IModelLoaders,
    ITemplateRunners {
  readonly variables: Variables;
}

export type CommandMode = 'folder' | 'module';

export interface IOperationBase {
  readonly variables: Variables;
  readonly configuration: IConfiguration;
}

export interface IGenerator
  extends IOperationBase,
    IModelLoaders,
    ITemplateRunners {
  readonly generatorName: string;
  readonly basePath: string;
  readonly outDir: string;
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

export interface ICommand
  extends IOperationBase,
    EngineConfigOptions,
    IModelLoaders,
    ITemplateRunners {
  readonly name: string;
  readonly commandMode: CommandMode;
  readonly caption?: string;
  readonly summary?: string;
  readonly details?: ModelDetails;
  readonly requireName: boolean;
  readonly requireModel: boolean;

  readonly generator: IGenerator;

  readonly runCommand: (
    context: ICommandContext
  ) => Promise<ICommandResult | undefined>;

  // readonly atTemplates: (...paths: string[]) => string;
}

/***********************************
 *       Command Execution         *
 ***********************************/

export interface ICommandStepBase {
  readonly stepTags?: string[];
  readonly skip?: boolean;
}

export interface ITargetFileCommandStep extends ICommandStepBase {
  readonly to: string;
  readonly overwrite?: boolean;
}

export interface CopyCommandStep extends ITargetFileCommandStep {
  readonly type: 'copy';
  readonly from: string;
}

export interface TemplateCommandStepBase
  extends ITargetFileCommandStep,
    LoadModelOptions,
    EngineConfigOptions {
  readonly from: string;
}

export interface TemplateCommandStep extends TemplateCommandStepBase {
  readonly type: 'file';
}

export interface SnippetCommandStep extends TemplateCommandStepBase {
  readonly type: 'snippet';
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
  readonly writeFile: (
    message: string,
    filePath: string,
    content: string
  ) => void;
  readonly writeMessage: (message: string) => void;
  readonly beginScope: (message: string, endMessage?: string) => () => void;
}

export interface IOperationContext {
  readonly name?: string;
  readonly model?: any;
  readonly h: GeneratorHelpers;
  readonly vars: Variables;
  readonly options: RequiredRunOptions;
  readonly configuration: IConfiguration;
  readonly fileSystem: IGeneratorFileSystem;
  readonly console: Consola;
}

export interface IGeneratorContext extends IOperationContext {
  readonly type: 'generator';
  readonly parentContext: IOperationContext;
  readonly generator: IGenerator;
  readonly self: IGeneratorContext;
}

export interface ICommandContext extends IOperationContext {
  readonly type: 'command';
  readonly parentContext: IGeneratorContext;
  readonly generator: IGenerator;
  readonly command: ICommand;
  readonly self: ICommandContext;
}

export interface IStepContext extends IOperationContext {
  readonly type: 'step';
  readonly parentContext: ICommandContext;
  readonly generator: IGenerator;
  readonly command: ICommand;
  readonly step: ICommandStep;
  readonly self: IStepContext;
}

export type OperationContext =
  | IGeneratorContext
  | ICommandContext
  | IStepContext;
