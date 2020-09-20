import chalk from 'chalk';
import { Consola } from 'consola';
import { fsReadFileContent } from './file-utils';
import { tracedError } from './logging';

export enum ModelFormatEnum {
  Module,
  Json,
  Yaml,
  Xml,
  Toml,
  Ini,
}

export interface ModelFormat {
  readonly name: string;
  readonly extensions: readonly string[];
  readonly enumType: ModelFormatEnum;
  readonly load: (filePath: string) => Promise<any | undefined>;
}

// TODO: Make this an extensibility point

const MODEL_FORMATS: ModelFormat[] = [
  {
    name: 'module',
    extensions: ['.js'],
    enumType: ModelFormatEnum.Module,
    load: async (filePath: string) => {
      try {
        const loadedModule = await import(filePath)
        console.dir(loadedModule)
        return await loadedModule()
      } catch (error) {
        throw new Error(`Model file '${filePath}' failed loading. \n${error}`)
      }
    },
  },
  {
    name: 'json',
    extensions: ['.json'],
    enumType: ModelFormatEnum.Json,
    load: async (filePath: string) => {
      try {
        const text = await fsReadFileContent(filePath)
        if (text) {
          const json5 = await import('json5')
          return json5.parse(text)
        }
        throw new Error(`Model file '${filePath}' does not exists or is empty`)
      } catch (error) {
        throw new Error(`Model file '${filePath}' failed loading. \n${error}`)
      }
    },
  },
  {
    name: 'yaml',
    extensions: ['.yaml', '.yml'],
    enumType: ModelFormatEnum.Json,
    load: async (filePath: string) => {
      try {
        const text = await fsReadFileContent(filePath)
        if (text) {
          const yaml = await import('js-yaml')
          return yaml.safeLoad(text)
        }
        throw new Error(`Model file '${filePath}' does not exists or is empty`)
      } catch (error) {
        throw new Error(`Model file '${filePath}' failed loading. \n${error}`)
      }
    },
  },
  {
    name: 'xml',
    extensions: ['.xml'],
    enumType: ModelFormatEnum.Xml,
    load: async (filePath: string) => {
      try {
        const text = await fsReadFileContent(filePath)
        if (text) {
          const xml = await import('xml2js')
          return await xml.parseStringPromise(text)
        }
        throw new Error(`Model file '${filePath}' does not exists or is empty`)
      } catch (error) {
        throw new Error(`Model file '${filePath}' failed loading. \n${error}`)
      }
    },
  },
  {
    name: 'toml',
    extensions: ['.toml'],
    enumType: ModelFormatEnum.Toml,
    load: async (filePath: string) => {
      try {
        const text = await fsReadFileContent(filePath)
        if (text) {
          const toml = await import('toml')
          return toml.parse(text)
        }
        throw new Error(`Model file '${filePath}' does not exists or is empty`)
      } catch (error) {
        throw new Error(`Model file '${filePath}' failed loading. \n${error}`)
      }
    },
  },
  {
    name: 'ini',
    extensions: ['.ini'],
    enumType: ModelFormatEnum.Ini,
    load: async (filePath: string) => {
      try {
        const text = await fsReadFileContent(filePath)
        if (text) {
          const ini = await import('ini')
          return ini.decode(text)
        }
        throw new Error(`Model file '${filePath}' does not exists or is empty`)
      } catch (error) {
        throw new Error(`Model file '${filePath}' failed loading. \n${error}`)
      }
    },
  },
];

function getModelFormats() {
  return MODEL_FORMATS.map((e) => chalk.greenBright(e.name)).join(', ');
}

export function findModelFormat(
  modelFormat: string | undefined,
  console: Consola
): ModelFormat | undefined {
  if (!modelFormat) {
    return undefined;
  }

  const name = modelFormat.toLowerCase();

  const engine = MODEL_FORMATS.find((e) => e.name == name);

  if (engine) {
    return engine;
  }

  throw tracedError(
    console,
    `Invalid model: '${chalk.redBright(
      modelFormat
    )}'. Use one of ${getModelFormats()}`
  );
}

export function findModelFormatFromExtension(
  extension: string,
  console: Consola
): ModelFormat {
  const ext = extension.toLowerCase();

  const engine = MODEL_FORMATS.find((e) => e.extensions.indexOf(ext) >= 0);

  if (engine) {
    return engine;
  }

  throw tracedError(
    console,
    `Unrecognized model format extension: '${chalk.redBright(
      extension
    )}'. Try to specify an explicit format from the following list: ${getModelFormats()}`
  );
}
