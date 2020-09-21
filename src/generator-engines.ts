import chalk from 'chalk';
import { Consola } from 'consola';
import { fsReadFileContent } from './file-utils';
import { tracedError } from './logging';

export enum GeneratorEngineEnum {
  EJS,
  Handlebars,
  Liquid,
  Mustache,
  Nunjucks,
  Pug,
}

async function withFileContent(filePath: string, action: (content: string) => Promise<string>) {
  try {
    const text = await fsReadFileContent(filePath);
    if (text) {
      return await action(text)
    }
    throw new Error(
      `Template file '${filePath}' does not exists or is empty`
    );
  } catch (error) {
    throw new Error(
      `Template file '${filePath}' failed loading. \n${error}`
    );
  }
}

export interface GeneratorEngine {
  readonly name: string;
  readonly extensions: readonly string[];
  readonly enumType: GeneratorEngineEnum;
  // TODO: Make execute receive the path instead of the content. Some engines allow to include/import and it needs actual paths
  readonly execute: (filePath: string, context: any) => Promise<string>;
}

// TODO: Make this an extensibility point

const GENERATOR_ENGINES: GeneratorEngine[] = [
  {
    name: 'ejs',
    extensions: ['.ejs'],
    enumType: GeneratorEngineEnum.EJS,
    execute: async (filePath, context) => {
      const ejs = await import('ejs');
      return await ejs.renderFile(filePath, context);
    },
  },
  {
    name: 'handlebars',
    extensions: ['.hbs', '.handlebars'],
    enumType: GeneratorEngineEnum.Handlebars,
    execute: async (filePath, context) => {
      return await withFileContent(filePath, async (text: string) => {
        const handlebars = await import('handlebars');
        const compiled = handlebars.compile(text);
        return compiled(context);
      })
    },
  },
  {
    name: 'liquid',
    extensions: ['.liquid'],
    enumType: GeneratorEngineEnum.Liquid,
    execute: async (filePath, context) => {
      const liquidjs = await import('liquidjs');
      const engine = new liquidjs.Liquid();
      return await engine.renderFile(filePath, context);
    },
  },
  {
    name: 'mustache',
    extensions: ['.mustache'],
    enumType: GeneratorEngineEnum.Mustache,
    execute: async (filePath, context) => {
      return await withFileContent(filePath, async (text: string) => {
        const mustache = await import('mustache');
        return mustache.render(text, context);
      })
    },
  },
  {
    name: 'nunjucks',
    extensions: ['.njk', '.nunjucks'],
    enumType: GeneratorEngineEnum.Nunjucks,
    execute: async (filePath, context) => {
      const nunjucks = await import('nunjucks');
      return nunjucks.render(filePath, context);
    },
  },
  {
    name: 'pug',
    extensions: ['.pug'],
    enumType: GeneratorEngineEnum.Pug,
    execute: async (filePath, context) => {
      const pug = await import('pug');
      const compiled = pug.compileFile(filePath);
      return compiled(context);
    },
  },
];

function getGeneratorNames() {
  return GENERATOR_ENGINES.map((e) => chalk.greenBright(e.name)).join(', ');
}

export function findGeneratorEngine(
  generatorName: string | undefined,
  console: Consola
): GeneratorEngine | undefined {
  if (!generatorName) {
    return undefined;
  }

  const name = generatorName.toLowerCase();

  const engine = GENERATOR_ENGINES.find((e) => e.name == name);

  if (engine) {
    return engine;
  }

  throw tracedError(
    console,
    `Invalid generator engine: '${chalk.redBright(
      generatorName
    )}'. Use one of ${getGeneratorNames()}`
  );
}
