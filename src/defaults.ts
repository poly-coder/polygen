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

export const getDefaultGlobalOptions = (): RequiredGlobalOptionsOnly => ({
  configFile: 'pcgen.config.js',
  logLevel: LogLevel.Info,
  version: '',
  showOptions: false,
});

export const getDefaultOutputOptions = (): RequiredOutputOptionsOnly => ({
  outDir: undefined,
  overwrite: undefined,
});

export const getDefaultSearchOptions = (): RequiredSearchOptionsOnly => ({
  generator: undefined,
  tag: [],
});

export const getDefaultPrintListOptions = (): RequiredPrintOptionsOnly => ({
  showBasePath: false,
  showSummary: false,
  showCommands: false,
  showDetails: false,
});

export const getDefaultPrintInfoOptions = (): RequiredPrintOptionsOnly => ({
  showBasePath: true,
  showSummary: true,
  showCommands: true,
  showDetails: true,
});

export const getDefaultInitOptions = (): RequiredInitOptionsOnly => ({
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
});

export const getDefaultRunOptions = (): RequiredRunOptionsOnly => ({
  command: '',
  dryRun: false,
  phases: '',
  stdout: false,
  stepTag: [],
});

export function requiredInitOptions(options?: InitOptions): RequiredInitOptions {
  return {
    outDir: '.',
    ...getDefaultInitOptions(),
    ...getDefaultGlobalOptions(),
    ...options,
  };
}

export function requiredListOptions(options?: ListOptions): RequiredListOptions {
  return {
    ...getDefaultGlobalOptions(),
    ...getDefaultSearchOptions(),
    ...getDefaultPrintListOptions(),
    ...options,
  };
}

export function requiredInfoOptions(options?: InfoOptions): RequiredInfoOptions {
  return {
    ...getDefaultGlobalOptions(),
    ...getDefaultSearchOptions(),
    ...getDefaultPrintInfoOptions(),
    ...options,
  };
}

export function requiredRunOptions(options?: RunOptions): RequiredRunOptions {
  return {
    ...getDefaultRunOptions(),
    ...getDefaultGlobalOptions(),
    ...getDefaultSearchOptions(),
    ...getDefaultOutputOptions(),
    ...options,
  };
}
