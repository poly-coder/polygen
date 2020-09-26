import { LogLevel } from 'consola';

export interface GlobalOptions {
  readonly configFile?: string;
  readonly logLevel: LogLevel;
  readonly version: string;
}

export interface InitOptionsOnly {
  readonly searchPaths?: string[];
  // readonly basePath?: string;
  readonly pcgenFolder?: string;
  readonly generatorFolder?: string;
  readonly commandsFolder?: string;
  readonly templatesFolder?: string;
  readonly defaultCommand?: string;
  readonly cwd?: string;
  readonly initAssets?: string;
}

export interface InitOptions extends GlobalOptions, InitOptionsOnly {}

export interface ListOptionsOnly {
  readonly name?: string;
}

export interface ListOptions extends GlobalOptions, ListOptionsOnly {}

export interface InfoOptionsOnly {
  readonly generatorName?: string;
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
}

export interface RunOptions extends GlobalOptions, RunOptionsOnly {}

export interface ICompleteConfigurationFile extends Required<InitOptionsOnly> {
}

export type IConfigurationFile = Partial<ICompleteConfigurationFile>;
