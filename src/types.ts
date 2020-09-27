import { LogLevel } from 'consola';

/********************
 *     Options      *
 ********************/

export interface GlobalOptions {
  readonly configFile?: string;
  readonly logLevel: LogLevel;
  readonly version: string;
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
  readonly outDir?: string;
}

export interface InitOptions extends GlobalOptions, InitOptionsOnly {}

export interface SearchOptionsOnly {
  readonly name?: string;
  // readonly tags: string[];
}

export interface PrintOptionsOnly {
  readonly showBasePath: boolean;
  readonly showSummary: boolean;
}

export interface ListOptionsOnly extends SearchOptionsOnly, PrintOptionsOnly {
}

export interface ListOptions extends GlobalOptions, ListOptionsOnly {}

export interface InfoOptionsOnly extends SearchOptionsOnly, PrintOptionsOnly {
}

export interface InfoOptions extends GlobalOptions, InfoOptionsOnly {}

export interface RunOptionsOnly {
  readonly name?: string;
  readonly generator: string;
  readonly step?: string;
  readonly tags?: string[];
  readonly model?: string;
  readonly jsonPath?: string;
  readonly modelFormat?: string;
  readonly phases?: string;
  readonly dryRun: boolean;
  readonly overwrite?: boolean;
  readonly stdout?: boolean;
  readonly outDir?: boolean;
}

export interface RunOptions extends GlobalOptions, RunOptionsOnly {}

/******************************
 *     Configuration File     *
 ******************************/

export interface IConfigurationFile extends InitOptionsOnly {

}

export interface IConfiguration extends Required<IConfigurationFile> {
}

/***********************************
 *     Generators and Commands     *
 ***********************************/

export interface IGenerator {
  readonly name: string;  
  readonly basePath: string;
  readonly configuration: IConfiguration;
}
