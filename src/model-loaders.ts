import chalk from "chalk";
import consola from "consola";
import { sprintBad } from "./logging";
import { IModelLoaderConfig } from "./types";

export const defaultModelLoaders: IModelLoaderConfig[] = [
  {
    name: 'module',
    extensions: ['.js'],
    fromPath: async (filePath: string) => {
      const loadedModule = await import(filePath);

      if (typeof loadedModule.default !== 'function') {
        consola.trace(chalk`Module at '${sprintBad(filePath)}' does not exports a default function`)
        return 
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
]
