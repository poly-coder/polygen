import consola from 'consola';
import path from 'path';
import { fsExistsAsFile, fsReadFileContent } from './file-utils';
import { createLogPrefix, sprintBad } from './logging';
import { createExtensionBasedPluginRegistry } from './plugins';
import {
  IFileLocator,
  IModelLoaderConfig,
  IModelLoaders,
  IPluginExtensions,
  Variables,
} from './types';

const defaultModelLoaders: IModelLoaderConfig[] = [
  {
    name: 'module',
    extensions: ['.js'],
    fromPath: async (filePath: string, context: any) => {
      const loadedModule = await import(filePath);

      if (typeof loadedModule.default !== 'function') {
        consola.trace(
          `Module at '${sprintBad(
            filePath
          )}' does not exports a default function`
        );
        return;
      }

      return await loadedModule.default(context);
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
      return ini.parse(content);
    },
  },
];

function replaceTextVariables(text: string, ...variables: Variables[]): string {
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

export function createFallbackModelLoader(
  fileLocator: IFileLocator
): IModelLoaders {
  return {
    ...fileLocator,
    loadModelFromContent: async (_content, _context, options) => {
      const errorLogger =
        options.isOptional === true ? consola.trace : consola.log;

      errorLogger(
        `There is no model loader registered for name '${sprintBad(
          options.loaderName
        )}'`
      );
      return undefined;
    },
    loadModelFromPath: async (filePath, _context, options) => {
      const errorLogger =
        options?.isOptional === true ? consola.trace : consola.log;

      errorLogger(
        `There is no model loader registered for name '${sprintBad(
          options?.loaderName ?? '(unspecified)'
        )}' or extension '${sprintBad(path.extname(filePath))}'`
      );
      return undefined;
    },
  };
}

export function createModelLoaders(
  config: IPluginExtensions,
  fallbackModelLoaders: IModelLoaders,
  loadDefaultPlugins: boolean
): IModelLoaders {
  const logPrefix = createLogPrefix('createModelLoaders');

  const { byName, byExtension } = createExtensionBasedPluginRegistry<
    IModelLoaderConfig
  >(
    logPrefix,
    'model loader',
    config.loaders ?? [],
    loadDefaultPlugins === false ? [] : defaultModelLoaders
  );

  return {
    ...fallbackModelLoaders,

    loadModelFromContent: async (content, context, options) => {
      const { loaderName, isOptional, replaceVariables } = options;

      const errorLogger = isOptional === true ? consola.trace : consola.log;

      const loader = byName.get(loaderName);

      if (!loader) {
        return await fallbackModelLoaders.loadModelFromContent(
          content,
          context,
          options
        );
      }

      try {
        if (loader.fromContent) {
          // Replace variables by default
          if (replaceVariables !== false) {
            content = replaceTextVariables(content, context.vars);
          }
          return await loader.fromContent(content, context);
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
    },

    loadModelFromPath: async (filePath, context, options) => {
      const { loaderName, isOptional, replaceVariables } = options ?? {};

      const errorLogger = isOptional === true ? consola.trace : consola.log;

      const extension = path.extname(filePath);

      const loader = loaderName
        ? byName.get(loaderName)
        : byExtension.get(extension);

      if (!loader) {
        return await fallbackModelLoaders.loadModelFromPath(
          filePath,
          context,
          options
        );
      }

      try {
        if (!(await fsExistsAsFile(filePath))) {
          errorLogger(`Model file '${sprintBad(filePath)}' does not exist`);
          return undefined;
        }

        if (loader.fromPath) {
          return await loader.fromPath(filePath, context);
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
            const text = replaceTextVariables(content, context.vars);
            return await loader.fromContent(text, context);
          }

          return await loader.fromContent(content, context);
        }

        errorLogger(
          `Model loader '${sprintBad(
            loader.name
          )}' does not define any load function.`
        );
        return undefined;
      } catch (error) {
        consola.error(
          `Error loading model of type '${sprintBad(loader.name)}'`
        );
        consola.trace(error);
        return undefined;
      }
    },
  };
}
