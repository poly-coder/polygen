import consola from 'consola';
import ejs from 'ejs';
import fs from 'fs-extra';
import json5 from 'json5';
import path from 'path';
import { applyGlobalOptions, loadConfigurationFile } from './configuration';
import { requiredInitOptions } from './defaults';
import { fsWriteFileContent } from './file-utils';
import { createLogPrefix, sprintGood } from './logging';
import { InitOptions, RequiredInitOptions } from './types';

async function executeInitialize(
  initOptions: RequiredInitOptions,
  logPrefix: string
) {
  const sourceFolder = initOptions.initAssets;
  const pcgenPath = initOptions.pcgenFolder;

  // Copy assets/generator folder

  const sourceGenerator = path.join(sourceFolder, 'generator');
  const targetGenerator = path.join(pcgenPath, initOptions.generatorFolder);

  consola.trace(
    `${logPrefix}: copy '${sprintGood(sourceGenerator)}'} to '${sprintGood(
      targetGenerator
    )}'`
  );
  await fs.copy(sourceGenerator, targetGenerator);

  // Copy assets/.gitignore

  const sourceGitIgnore = path.join(sourceFolder, '_gitignore');
  const targetGitIgnore = path.join(pcgenPath, '.gitignore');

  consola.trace(
    `${logPrefix}: copy '${sprintGood(sourceGitIgnore)}' to '${sprintGood(
      targetGitIgnore
    )}'`
  );
  await fs.copy(sourceGitIgnore, targetGitIgnore);

  // Create pcgen.js config file

  const sourceConfigTemplate = path.join(sourceFolder, 'pcgen.config.js.ejs');
  const targetConfig = path.join(initOptions.configFile);

  consola.trace(`${logPrefix}: generate '${sprintGood(targetConfig)}'`);
  const configContent = await ejs.renderFile(sourceConfigTemplate, {
    json5: json5,
    config: {
      cwd: initOptions.cwd,
      outDir: initOptions.outDir,
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
}

export async function initialize(options: InitOptions) {
  const initOptions = requiredInitOptions(options);

  if (initOptions.showOptions) {
    consola.log('Initialize Options: ', initOptions);
  }

  applyGlobalOptions(initOptions);

  const logPrefix = createLogPrefix('initialize');

  consola.trace(`${logPrefix}: [Start]`);

  const config = await loadConfigurationFile(initOptions.configFile);

  if (config) {
    consola.log(
      `${sprintGood('PCGen configuration file is already initialized')}`
    );
    return;
  }

  consola.log(`Initializing PCGen configuration ...`);

  await executeInitialize(initOptions, logPrefix);

  consola.log(sprintGood('PCGen configuration initialized!'));
}
