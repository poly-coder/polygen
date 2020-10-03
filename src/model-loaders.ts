import consola from 'consola';
import path from 'path';
import { fsExistsAsFile, fsReadFileContent } from './file-utils';
import {
  createLogPrefix,
  sprintBad,
  sprintGood,
  sprintGoodList,
} from './logging';
import {
  IConfigurationFile,
  IModelLoaderConfig,
  IModelLoaders,
  Variables,
} from './types';

export const defaultModelLoaders: IModelLoaderConfig[] = [
  {
    name: 'module',
    extensions: ['.js'],
    fromPath: async (filePath: string) => {
      const loadedModule = await import(filePath);

      if (typeof loadedModule.default !== 'function') {
        consola.trace(
          `Module at '${sprintBad(
            filePath
          )}' does not exports a default function`
        );
        return;
      }

      return await loadedModule.default();
    },
  },
  {
    name: 'json',
    extensions: ['.json', '.json5'],
    fromContent: async (content: string) => {
      const json5 = await import('json5');
      return json5.parse(content);
    },
  },
  {
    name: 'yaml',
    extensions: ['.yaml', '.yml'],
    fromContent: async (content: string) => {
      const yaml = await import('js-yaml');
      return yaml.safeLoad(content);
    },
  },
  {
    name: 'xml',
    extensions: ['.xml'],
    fromContent: async (content: string) => {
      const xml = await import('xml2js');
      return await xml.parseStringPromise(content);
    },
  },
  {
    name: 'toml',
    extensions: ['.toml'],
    fromContent: async (content: string) => {
      const toml = await import('toml');
      return toml.parse(content);
    },
  },
  {
    name: 'ini',
    extensions: ['.ini'],
    fromContent: async (content: string) => {
      const ini = await import('ini');
      return ini.decode(content);
    },
  },
];

export function replaceTextVariables(
  text: string,
  ...variables: Variables[]
): string {
  return text.replace(
    /%([A-Za-z_][A-Za-z_0-9]*)%/,
    (substring: string, varName: string): string => {
      for (const vars of variables) {
        const result = vars[varName];
        if (result) {
          return result;
        }
      }
      return substring;
    }
  );
}

export function createModelLoaders(
  config: IConfigurationFile,
  variables: Variables
): IModelLoaders {
  const logPrefix = createLogPrefix('createModelLoaders');

  const byName = new Map<string, IModelLoaderConfig>();
  const byExtension = new Map<string, IModelLoaderConfig>();

  function addLoader(loader: IModelLoaderConfig, isDefault: boolean) {
    const extensions = loader.extensions
      ? sprintGoodList(loader.extensions)
      : sprintBad('None');

    consola.trace(
      `${logPrefix}: ${
        isDefault ? 'Default model' : 'Model'
      } loader '${sprintGood(loader.name)}' for extensions: ${extensions}`
    );

    const warnLogger = isDefault ? consola.trace : consola.warn;

    if (byName.has(loader.name)) {
      warnLogger(
        `There are multiple model loaders with name '${sprintBad(loader.name)}'`
      );
    } else {
      byName.set(loader.name, loader);
    }

    for (const extension of loader.extensions ?? []) {
      if (byExtension.has(extension)) {
        warnLogger(
          `There are multiple model loaders with extension '${sprintBad(
            extension
          )}'`
        );
      } else {
        byExtension.set(extension, loader);
      }
    }
  }

  for (const loader of config.modelLoaders ?? []) {
    addLoader(loader, false);
  }

  for (const loader of config.useDefaultModelLoaders === false
    ? []
    : defaultModelLoaders) {
    addLoader(loader, true);
  }

  const loadModelFromContent = async (
    content: string,
    loaderName: string,
    isOptional?: boolean,
    replaceVariables?: boolean
  ): Promise<any | undefined> => {
    const errorLogger = isOptional === true ? consola.trace : consola.log;

    const loader = byName.get(loaderName);

    if (!loader) {
      errorLogger(
        `There is no model loader register for name '${sprintBad(loaderName)}'`
      );
      return undefined;
    }

    try {
      if (loader.fromContent) {
        const text = await loader.fromContent(content);
        // Replace variables by default
        if (replaceVariables !== false) {
          return replaceTextVariables(text, variables);
        }

        return text;
      }

      errorLogger(
        `Model loader '${sprintBad(
          loaderName
        )}' cannot load from content. You need to pass the filePath.`
      );
      return undefined;
    } catch (error) {
      consola.error(`Error loading model of type '${sprintBad(loaderName)}'`);
      consola.trace(error);
      return undefined;
    }
  };

  const loadModelFromPath = async (
    filePath: string,
    loaderName?: string,
    isOptional?: boolean,
    replaceVariables?: boolean
  ): Promise<any | undefined> => {
    const errorLogger = isOptional === true ? consola.trace : consola.log;

    const extension = path.extname(filePath);

    const loader = loaderName
      ? byName.get(loaderName)
      : byExtension.get(extension);

    if (!loader) {
      errorLogger(
        `There is no model loader register for name '${sprintBad(
          loaderName
        )}' or extension '${sprintBad(extension)}'`
      );
      return undefined;
    }

    try {
      if (!(await fsExistsAsFile(filePath))) {
        errorLogger(`Model file '${sprintBad(filePath)}' does not exist`);
        return undefined;
      }

      if (loader.fromPath) {
        return await loader.fromPath(filePath);
      }

      if (loader.fromContent) {
        const content = await fsReadFileContent(filePath);

        if (content === undefined) {
          errorLogger(
            `Cannot read content of model file '${sprintBad(filePath)}'.`
          );
          return undefined;
        }

        if (replaceVariables === true) {
          const text = replaceTextVariables(content, variables);
          return await loader.fromContent(text);
        }

        return await loader.fromContent(content);
      }

      errorLogger(
        `Model loader '${sprintBad(
          loader.name
        )}' does not define any load function.`
      );
      return undefined;
    } catch (error) {
      consola.error(`Error loading model of type '${sprintBad(loader.name)}'`);
      consola.trace(error);
      return undefined;
    }
  };

  return {
    loadModelFromContent,
    loadModelFromPath,
  };
}
