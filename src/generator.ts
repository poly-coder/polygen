import chalk from 'chalk';
import consola, { LogLevel } from 'consola';
import ejs from 'ejs';
import fs from 'fs-extra';
import json5 from 'json5';
import path from 'path';
import { fsExistsAsFile, fsWriteFileContent } from './file-utils';
import { createLogPrefix } from './logging';
import { GlobalOptions, IConfigurationFile, InitOptions } from './types';

function applyGlobalOptions(options: GlobalOptions) {
  consola.level = options.logLevel;
}

export async function loadConfigurationFile(
  configFile: string
): Promise<IConfigurationFile | undefined> {
  const logPrefix = createLogPrefix('loadConfigurationFile');

  consola.trace(chalk`${logPrefix}: [Start]`);

  consola.trace(chalk`${logPrefix}: configFile='${configFile}'`);

  try {
    if (!(await fsExistsAsFile(configFile))) {
      consola.trace(`${logPrefix}: Config file not found`);
      return undefined;
    }

    consola.trace(chalk`${logPrefix}: Loading module`);

    const configModule = await import(configFile);

    consola.trace(chalk`${logPrefix}: Module loaded`);

    if (typeof configModule?.default !== 'function') {
      consola.info(
        chalk`${logPrefix}: {red ${'Configuration file must export a default function to return configuration'}}`
      );
    }

    const config = await configModule.default();

    // TODO: Validate configuration with joi library

    consola.trace(chalk`${logPrefix}: configFile='${configFile}'`);

    return config;
  } catch (error) {
    consola.info(
      chalk`Error trying to load configuration file {red '${configFile}'}`
    );

    return undefined;
  }
}

function defaultInitOptions(options?: InitOptions): Required<InitOptions> {
  return {
    basePath: '.',
    configFile: 'pcgen.js',
    cwd: '.',
    generatorFolder: 'generator',
    commandsFolder: 'commands',
    templatesFolder: 'templates',
    defaultCommand: 'new',
    initAssets: path.normalize(path.relative('.', path.join(__dirname, '../assets'))),
    logLevel: LogLevel.Info,
    pcgenFolder: '_pcgen',
    searchPaths: [],
    version: '',
    ...options,
  };
}

export async function initialize(options: InitOptions) {
  const initOptions = defaultInitOptions(options);

  applyGlobalOptions(initOptions);

  const logPrefix = createLogPrefix('initialize');

  consola.trace(chalk`${logPrefix}: [Start]`);

  const config = await loadConfigurationFile(initOptions.configFile);

  if (config) {
    consola.info(
      chalk`{green ${'PCGen configuration file is already initialized'}}`
    );
  } else {
    consola.info(chalk`Initializing PCGen configuration ...`);

    const sourceFolder = initOptions.initAssets;
    const basePath = initOptions.basePath;
    const pcgenPath = path.join(basePath, initOptions.pcgenFolder);

    // Copy assets/generator folder

    const sourceGenerator = path.join(sourceFolder, 'generator');
    const targetGenerator = path.join(pcgenPath, initOptions.generatorFolder);

    consola.trace(
      chalk`${logPrefix}: copy {green '${sourceGenerator}'} to {green '${targetGenerator}'}`
    );
    await fs.copy(sourceGenerator, targetGenerator);

    // Copy assets/.gitignore

    const sourceGitIgnore = path.join(sourceFolder, '_gitignore');
    const targetGitIgnore = path.join(pcgenPath, '.gitignore');

    consola.trace(
      chalk`${logPrefix}: copy {green '${sourceGitIgnore}'} to {green '${targetGitIgnore}'}`
    );
    await fs.copy(sourceGitIgnore, targetGitIgnore);

    // Create pcgen.js config file

    const sourceConfigTemplate = path.join(sourceFolder, 'pcgen.js.ejs');
    const targetConfig = path.join(basePath, initOptions.configFile);

    consola.trace(
      chalk`${logPrefix}: generate {green '${targetConfig}'}`
    );
    const configContent = await ejs.renderFile(sourceConfigTemplate, {
      json5: json5,
      config: {
        basePath: initOptions.basePath,
        cwd: initOptions.cwd,
        generatorFolder: initOptions.generatorFolder,
        commandsFolder: initOptions.commandsFolder,
        templatesFolder: initOptions.templatesFolder,
        defaultCommand: initOptions.defaultCommand,
        initAssets: initOptions.initAssets,
        pcgenFolder: initOptions.pcgenFolder,
        searchPaths: initOptions.searchPaths,
      }
    })

    await fsWriteFileContent(targetConfig, configContent)


    consola.info(chalk`{green ${'PCGen configuration initialized!'}}`);
  }
}
