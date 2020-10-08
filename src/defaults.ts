import { LogLevel } from 'consola';
import path from 'path';
import {
  InfoOptions,
  InitOptions,
  ListOptions,
  RequiredGlobalOptionsOnly,
  RequiredInfoOptions,
  RequiredInitOptions,
  RequiredInitOptionsOnly,
  RequiredListOptions,
  RequiredOutputOptionsOnly,
  RequiredPrintOptionsOnly,
  RequiredRunOptions,
  RequiredRunOptionsOnly,
  RequiredSearchOptionsOnly,
  RunOptions,
} from './types';

export const defaultGlobalOptions: RequiredGlobalOptionsOnly = {
  configFile: 'pcgen.config.js',
  logLevel: LogLevel.Info,
  version: '',
  showOptions: false,
};

export const defaultOutputOptions: RequiredOutputOptionsOnly = {
  outDir: '.',
  overwrite: undefined,
};

export const defaultSearchOptions: RequiredSearchOptionsOnly = {
  generator: undefined,
  tag: [],
};

export const defaultPrintListOptions: RequiredPrintOptionsOnly = {
  showBasePath: false,
  showSummary: false,
  showCommands: false,
  showDetails: false,
};

export const defaultPrintInfoOptions: RequiredPrintOptionsOnly = {
  showBasePath: true,
  showSummary: true,
  showCommands: true,
  showDetails: true,
};

export const defaultInitOptions: RequiredInitOptionsOnly = {
  cwd: '.',
  generatorFolder: 'generator',
  commandsFolder: 'commands',
  templatesFolder: 'templates',
  defaultCommand: 'new',
  initAssets: path.normalize(
    path.relative('.', path.join(__dirname, '../assets'))
  ),
  pcgenFolder: '_pcgen',
  searchPaths: [],
};

export const defaultRunOptions: RequiredRunOptionsOnly = {
  command: '',
  dryRun: false,
  phases: '',
  stdout: false,
  stepTag: [],
};

export function requiredInitOptions(options?: InitOptions): RequiredInitOptions {
  return {
    ...defaultInitOptions,
    ...defaultGlobalOptions,
    ...options,
    outDir: '.'
  };
}

export function requiredListOptions(options?: ListOptions): RequiredListOptions {
  return {
    ...defaultGlobalOptions,
    ...defaultSearchOptions,
    ...defaultPrintListOptions,
    ...options,
  };
}

export function requiredInfoOptions(options?: InfoOptions): RequiredInfoOptions {
  return {
    ...defaultGlobalOptions,
    ...defaultSearchOptions,
    ...defaultPrintInfoOptions,
    ...options,
  };
}

export function requiredRunOptions(options?: RunOptions): RequiredRunOptions {
  return {
    ...defaultRunOptions,
    ...defaultGlobalOptions,
    ...defaultSearchOptions,
    ...defaultOutputOptions,
    ...options,
  };
}
