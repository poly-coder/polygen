import chalk from 'chalk';
import consola, { LogLevel } from 'consola';
import ejs from 'ejs';
import fs from 'fs-extra';
import json5 from 'json5';
import path from 'path';
import { fsExistsAsFile, fsListDirectories, fsWriteFileContent, joinPaths } from './file-utils';
import { createLogPrefix } from './logging';
import {
  GlobalOptions,
  ICompleteConfigurationFile,
  IConfigurationFile,
  InfoOptions,
  InitOptions,
  ListOptions,
} from './types';

const defaultGlobalOptions: Required<GlobalOptions> = {
  configFile: 'pcgen.js',
  logLevel: LogLevel.Info,
  version: '',
};

function applyGlobalOptions(options: GlobalOptions) {
  consola.level = options.logLevel;
}

export async function loadConfigurationFile(
  configFile: string
): Promise<IConfigurationFile | undefined> {
  const logPrefix = createLogPrefix('loadConfigurationFile');

  consola.trace(chalk`${logPrefix}: [Start]`);
  
  consola.trace(chalk`${logPrefix}: configFile='${configFile}'`);
  
  const fileName = path.normalize(path.resolve(joinPaths('.', configFile)))
  
  consola.trace(chalk`${logPrefix}: fileName='${fileName}'`);

  try {
    if (!(await fsExistsAsFile(fileName))) {
      consola.trace(`${logPrefix}: Config file not found`);
      return undefined;
    }

    consola.trace(chalk`${logPrefix}: Loading module`);

    const configModule = await import(fileName);

    consola.trace(chalk`${logPrefix}: Module loaded`);

    if (typeof configModule?.default !== 'function') {
      consola.log(
        chalk`${logPrefix}: {red ${'Configuration file must export a default function to return configuration'}}`
      );
    }

    const config = await configModule.default();

    // TODO: Validate configuration with joi library

    return config;
  } catch (error) {
    consola.log(
      chalk`Error trying to load configuration file {red '${configFile}'}`
    );
    consola.log(error);

    return undefined;
  }
}

const defaultInitOptions: Required<InitOptions> = {
  ...defaultGlobalOptions,
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

function requiredInitOptions(options?: InitOptions): Required<InitOptions> {
  return {
    ...defaultInitOptions,
    ...options,
  };
}

export async function initialize(options: InitOptions) {
  const initOptions = requiredInitOptions(options);

  applyGlobalOptions(initOptions);

  const logPrefix = createLogPrefix('initialize');

  consola.trace(chalk`${logPrefix}: [Start]`);

  const config = await loadConfigurationFile(initOptions.configFile);

  if (config) {
    consola.log(
      chalk`{green ${'PCGen configuration file is already initialized'}}`
    );
  } else {
    consola.log(chalk`Initializing PCGen configuration ...`);

    const sourceFolder = initOptions.initAssets;
    const pcgenPath = initOptions.pcgenFolder;

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
    const targetConfig = path.join(initOptions.configFile);

    consola.trace(chalk`${logPrefix}: generate {green '${targetConfig}'}`);
    const configContent = await ejs.renderFile(sourceConfigTemplate, {
      json5: json5,
      config: {
        cwd: initOptions.cwd,
        generatorFolder: initOptions.generatorFolder,
        commandsFolder: initOptions.commandsFolder,
        templatesFolder: initOptions.templatesFolder,
        defaultCommand: initOptions.defaultCommand,
        initAssets: initOptions.initAssets,
        pcgenFolder: initOptions.pcgenFolder,
        searchPaths: initOptions.searchPaths,
      },
    });

    await fsWriteFileContent(targetConfig, configContent);

    consola.log(chalk`{green ${'PCGen configuration initialized!'}}`);
  }
}

function requiredConfig(config: IConfigurationFile): ICompleteConfigurationFile {
  return {
    ...defaultInitOptions,
    ...config,
  }
}

const defaultListOptions: Required<ListOptions> = {
  ...defaultGlobalOptions,
  name: '',
};

function requiredListOptions(options?: ListOptions): Required<ListOptions> {
  return {
    ...defaultListOptions,
    ...options,
  };
}

export async function listGenerators(options: ListOptions) {
  const listOptions = requiredListOptions(options);

  applyGlobalOptions(listOptions);

  const logPrefix = createLogPrefix('listGenerators');

  consola.trace(chalk`${logPrefix}: [Start]`);

  const config = await loadConfigurationFile(listOptions.configFile);

  if (!config) {
    consola.log(
      chalk`PCGen is not initialized in current folder. Run command {green pcgen init} to start using pcgen`
    );
  } else {
    const conf = requiredConfig(config)
    
    const directories = await fsListDirectories(conf.pcgenFolder)

    directories.forEach(name => {
      if (!listOptions.name || name.toLowerCase().indexOf(listOptions.name.toLowerCase()) >= 0) {
        consola.log(chalk`- {green ${name}}`)
      }
    });
  }
}

const defaultInfoOptions: Required<InfoOptions> = {
  ...defaultGlobalOptions,
  generatorName: '',
};

function requiredInfoOptions(options?: InfoOptions): Required<InfoOptions> {
  return {
    ...defaultInfoOptions,
    ...options,
  };
}

export async function showGeneratorInfo(options: InfoOptions) {
  const infoOptions = requiredInfoOptions(options);

  applyGlobalOptions(infoOptions);

  const logPrefix = createLogPrefix('showGeneratorInfo');

  consola.trace(chalk`${logPrefix}: [Start]`);

  const config = await loadConfigurationFile(infoOptions.configFile);

  if (!config) {
    consola.log(
      chalk`PCGen is not initialized in current folder. Run command {green pcgen init} to start using pcgen`
    );
  } else {
    const conf = requiredConfig(config)

    consola.log('conf', conf)
    consola.log('infoOptions', infoOptions)

    // TODO: load generator from folder
  }
}
