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

async function withFileContent(
  filePath: string,
  action: (content: string) => Promise<any>
) {
  try {
    const text = await fsReadFileContent(filePath);
    if (text) {
      return await action(text);
    }
    throw new Error(`Model file '${filePath}' does not exists or is empty`);
  } catch (error) {
    throw new Error(`Model file '${filePath}' failed loading. \n${error}`);
  }
}

// TODO: Make this an extensibility point

const MODEL_FORMATS: ModelFormat[] = [
  {
    name: 'module',
    extensions: ['.js'],
    enumType: ModelFormatEnum.Module,
    load: async (filePath: string) => {
      try {
        const loadedModule = await import(filePath);

        if (typeof loadedModule?.default !== 'function') {
          throw new Error(
            `Module '${filePath}' does not exports default function`
          );
        }

        return await loadedModule.default();
      } catch (error) {
        throw new Error(`Model file '${filePath}' failed loading. \n${error}`);
      }
    },
  },
  {
    name: 'json',
    extensions: ['.json'],
    enumType: ModelFormatEnum.Json,
    load: async (filePath: string) => {
      return await withFileContent(filePath, async (text: string) => {
        const json5 = await import('json5');
        return json5.parse(text);
      });
    },
  },
  {
    name: 'yaml',
    extensions: ['.yaml', '.yml'],
    enumType: ModelFormatEnum.Json,
    load: async (filePath: string) => {
      return await withFileContent(filePath, async (text: string) => {
        const yaml = await import('js-yaml');
        return yaml.safeLoad(text);
      });
    },
  },
  {
    name: 'xml',
    extensions: ['.xml'],
    enumType: ModelFormatEnum.Xml,
    load: async (filePath: string) => {
      return await withFileContent(filePath, async (text: string) => {
        const xml = await import('xml2js');
        return await xml.parseStringPromise(text);
      });
    },
  },
  {
    name: 'toml',
    extensions: ['.toml'],
    enumType: ModelFormatEnum.Toml,
    load: async (filePath: string) => {
      return await withFileContent(filePath, async (text: string) => {
        const toml = await import('toml');
        return toml.parse(text);
      });
    },
  },
  {
    name: 'ini',
    extensions: ['.ini'],
    enumType: ModelFormatEnum.Ini,
    load: async (filePath: string) => {
      return await withFileContent(filePath, async (text: string) => {
        const ini = await import('ini');
        return ini.decode(text);
      });
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

  const format = MODEL_FORMATS.find((e) => e.extensions.indexOf(ext) >= 0);

  if (format) {
    return format;
  }

  throw tracedError(
    console,
    `Unrecognized model format extension: '${chalk.redBright(
      extension
    )}'. Try to specify an explicit format from the following list: ${getModelFormats()}`
  );
}
