import { LogLevel } from 'consola';

export interface GlobalOptions {
  readonly configFile?: string;
  readonly logLevel: LogLevel;
  readonly version: string;
}

export interface InitOptions extends GlobalOptions {
  readonly searchPaths?: string[];
  readonly basePath?: string;
  readonly pcgenFolder?: string;
  readonly generatorFolder?: string;
  readonly commandsFolder?: string;
  readonly templatesFolder?: string;
  readonly defaultCommand?: string;
  readonly cwd?: string;
  readonly initAssets?: string;
}

export interface ListOptions extends GlobalOptions {
  readonly name?: string;
}

export interface InfoOptions extends GlobalOptions {
  readonly generatorName?: string;
}

export interface RunOptions extends GlobalOptions {
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

export interface ICompleteConfigurationFile {
  /**
   * Paths where to locate generators
   */
  readonly searchPaths: readonly string[];
  /**
   * Paths where to locate local generators and create new ones. Created with pcgen init
   */
  readonly basePath: string;
  /**
   * pcgen folder where generators are located, relative to base path. Default: '_pcgen'
   */
  readonly pcgenFolder: string;
  /**
   * generator folder where init generator is located, relative to pcgen path. Default: 'generator'
   */
  readonly generatorFolder: string;
  /**
   * commands folder where commands are located, relative to generator folder. Default: 'commands'
   */
  readonly commandsFolder: string;
  /**
   * templates folder where templates are located, relative to generator folder. Default: 'templates'
   */
  readonly templatesFolder: string;
  /**
   * default command used when a generator is executed. Default: 'new'
   */
  readonly defaultCommand: string;
  /**
   * current working directory where new files are generated relative to it. Default: 'process.cwd()'
   */
  readonly cwd: string;
  /**
   * initAssets folder where initializer generator is located.
   */
  readonly initAssets: string;
}

export type IConfigurationFile  = Partial<ICompleteConfigurationFile>
