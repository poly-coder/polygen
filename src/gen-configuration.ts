import { GeneratorSystemConfig, GlobalOptions } from './gen-types';
import path from 'path';
import { Consola } from 'consola';
import { fsReadFileContent, joinPaths } from './file-utils';
import { tracedError } from './logging';
import chalk from 'chalk';

const defaultGeneratorSystemConfig: GeneratorSystemConfig = {
  searchPaths: [],
  basePath: '.',
  pcgenFolder: '_pcgen',
  generatorFolder: 'generator',
  commandsFolder: 'commands',
  templatesFolder: 'templates',
  defaultCommand: 'new',
  cwd: '.',
  initAssets: path.relative(
    '.',
    joinPaths(__dirname, '../assets')
  ),
};

export function createGeneratorSystemConfig(
  options?: Partial<GeneratorSystemConfig>
): GeneratorSystemConfig {
  return {
    ...defaultGeneratorSystemConfig,
    ...options,
  };
}

export const pcgenConfigFileNames = ['.pcgen.json', '.pcgen', '.pcgenrc'];

export async function readGeneratorSystemConfig(
  options: GlobalOptions,
  console: Consola
): Promise<GeneratorSystemConfig> {
  const configFileNames = options.configFile
    ? [options.configFile]
    : pcgenConfigFileNames

  for (const fileName of configFileNames) {
    let content = await fsReadFileContent(fileName);

    if (content) {
      try {
        const options = JSON.parse(content);
        const result = createGeneratorSystemConfig(options);
        console.trace(`readGeneratorSystemConfig: Using pcgen config file '${fileName}'`)
        return result
      } catch (error) {
        throw tracedError(
          console,
          `readGeneratorSystemConfig: Error reading generator configuration from file '${fileName}'`
        );
      }
    }
  }

  throw tracedError(
    console,
    `readGeneratorSystemConfig: Generator configuration file NOT FOUND. Try ${chalk.greenBright("'pcgen init'")} to create one.`
  );
}

export function createConfigHelpers(config: GeneratorSystemConfig) {
  // /**/%CWD%
  const cwd = path.resolve(config.cwd);

  // /**/%BASE_PATH%
  const baseFullPath = path.resolve(config.basePath);

  // /**/%CWD%/<relative-path>
  const atCwdFullPath = (...paths: string[]) => path.resolve(joinPaths(cwd, ...paths));

  // %BASE_PATH%/_pcgen
  const pcgenPath = joinPaths(config.basePath, config.pcgenFolder);

  // /**/%BASE_PATH%/_pcgen
  const pcgenFullPath = joinPaths(baseFullPath, config.pcgenFolder);

  // %BASE_PATH%/<relative-path>
  const atPcgenPath = (...paths: string[]) => joinPaths(pcgenPath, ...paths);

  // /**/%BASE_PATH%/<relative-path>
  const atPcgenFullPath = (...paths: string[]) =>
    joinPaths(pcgenFullPath, ...paths);

  // // %BASE_PATH%/_pcgen/<generator>/relativePath
  // const itemPath = (generatorName: string, relativePath: string) =>
  //   joinPaths(generatorPath(generatorName), relativePath);

  // // /**/%BASE_PATH%/_pcgen/<generator>/relativePath
  // const itemFullPath = (generatorName: string, relativePath: string) =>
  //   pcgenFullPath(itemPath(generatorName, relativePath));

  // %GENERATOR_PATH%/commands/<relative-path>
  const atCommandsPath = (generatorFullPath: string, ...paths: string[]) =>
    joinPaths(generatorFullPath, config.commandsFolder, ...paths);

  // %GENERATOR_PATH%/templates/<relative-path>
  const atTemplatesPath = (generatorFullPath: string, ...paths: string[]) =>
    joinPaths(generatorFullPath, config.templatesFolder, ...paths);

  return {
    // Strings
    cwd: cwd,
    pwd: cwd,
    basePath: config.basePath,
    baseFullPath,

    pcgenFolder: config.pcgenFolder,
    pcgenPath,
    pcgenFullPath,

    generatorFolder: config.generatorFolder,

    commandsFolder: config.commandsFolder,
    templatesFolder: config.templatesFolder,
    defaultCommand: config.defaultCommand,
    initAssets: config.initAssets,

    // Functions
    atCwdFullPath,
    atPcgenPath,
    atPcgenFullPath,
    // pcgenPath,
    // pcgenFullPath,
    // generatorPath,
    // generatorFullPath,
    // itemPath,
    // // itemFullPath,
    atCommandsPath,
    atTemplatesPath,
  };
}
