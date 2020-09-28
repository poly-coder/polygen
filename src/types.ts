import { LogLevel } from 'consola';

export type Variables = Readonly<Record<string, string>>;

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
  readonly model?: string;
  readonly jsonPath?: string;
  readonly modelFormat?: string;
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
  readonly model?: string;
  readonly jsonPath?: string;
  readonly modelFormat?: string;
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

/******************************
 *     Configuration File     *
 ******************************/

export interface IModelLoaderConfig {
  readonly name: string;
  readonly extensions?: string[];
  readonly fromContent?: (content: string) => Promise<any | undefined>;
  readonly fromPath?: (path: string) => Promise<any | undefined>;
}

export interface IConfigurationFile extends InitOptionsOnly, OutputOptionsOnly {
  readonly useDefaultModelLoaders?: boolean;
  readonly modelLoaders?: IModelLoaderConfig[];
}

export interface IConfiguration extends RequiredInitOptionsOnly {
  readonly atCWD: (...paths: string[]) => string;
  readonly atBasePath: (...paths: string[]) => string;
  readonly atOutDir: (...paths: string[]) => string;

  readonly variables: Variables;

  readonly loadModelFromContent: (
    content: string,
    loaderName: string,
    isOptional?: boolean,
    replaceVariables?: boolean
  ) => Promise<any | undefined>;

  readonly loadModelFromPath: (
    path: string,
    loaderName?: string,
    isOptional?: boolean,
    replaceVariables?: boolean
  ) => Promise<any | undefined>;
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
  js?: string;
  folder?: string;
  caption?: string;
  summary?: string;
  details?: ModelDetails;
}

export type CommandMode = 'folder' | 'js';

export interface IGenerator {
  readonly name: string;
  readonly basePath: string;
  readonly configuration: IConfiguration;
  readonly defaultCommandMode: CommandMode;
  readonly defaultCommand: string;
  readonly caption?: string;
  readonly summary?: string;
  readonly details?: ModelDetails;
  readonly tags: string[];
  readonly defaultEngine?: string;
  readonly defaultEngineOptions?: string;
  readonly commands: readonly ICommand[];
}

export interface ICommand {
  readonly name: string;
  readonly commandMode: CommandMode;
  readonly caption?: string;
  readonly summary?: string;
  readonly details?: ModelDetails;
}
