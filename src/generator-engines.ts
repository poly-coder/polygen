import chalk from 'chalk';
import { Consola } from 'consola';
import { fsReadFileContent } from './file-utils';
import { tracedError } from './logging';

export enum TemplateEngineEnum {
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

export interface TemplateEngine {
  readonly name: string;
  readonly extensions: readonly string[];
  readonly enumType: TemplateEngineEnum;
  // TODO: Make execute receive the path instead of the content. Some engines allow to include/import and it needs actual paths
  readonly execute: (filePath: string, context: any, options?: any) => Promise<string>;
}

// TODO: Make this an extensibility point

const TEMPLATE_ENGINES: TemplateEngine[] = [
  {
    name: 'ejs',
    extensions: ['.ejs'],
    enumType: TemplateEngineEnum.EJS,
    execute: async (filePath, context, options) => {
      const ejs = await import('ejs');
      return  await ejs.renderFile(filePath, context, options)
    },
  },
  {
    name: 'handlebars',
    extensions: ['.hbs', '.handlebars'],
    enumType: TemplateEngineEnum.Handlebars,
    execute: async (filePath, context, options) => {
      return await withFileContent(filePath, async (text: string) => {
        const handlebars = await import('handlebars');
        const compiled = handlebars.compile(text, options);
        return compiled(context);
      })
    },
  },
  {
    name: 'liquid',
    extensions: ['.liquid'],
    enumType: TemplateEngineEnum.Liquid,
    execute: async (filePath, context, options) => {
      const liquidjs = await import('liquidjs');
      const engine = new liquidjs.Liquid(options);
      return await engine.renderFile(filePath, context);
    },
  },
  {
    name: 'mustache',
    extensions: ['.mustache'],
    enumType: TemplateEngineEnum.Mustache,
    execute: async (filePath, context, options) => {
      return await withFileContent(filePath, async (text: string) => {
        const mustache = await import('mustache');
        const partials = options?.partials
        const tags = options?.tags
        return mustache.render(text, context, partials, tags);
      })
    },
  },
  {
    name: 'nunjucks',
    extensions: ['.njk', '.nunjucks'],
    enumType: TemplateEngineEnum.Nunjucks,
    execute: async (filePath, context, options) => {
      const nunjucks = await import('nunjucks');
      const environment = nunjucks.configure(options ?? {})
      return environment.render(filePath, context);
    },
  },
  {
    name: 'pug',
    extensions: ['.pug'],
    enumType: TemplateEngineEnum.Pug,
    execute: async (filePath, context, options) => {
      const pug = await import('pug');
      const compiled = pug.compileFile(filePath, options);
      return compiled(context);
    },
  },
];

function getEngineNames() {
  return TEMPLATE_ENGINES.map((e) => chalk.greenBright(e.name)).join(', ');
}

export function findTemplateEngine(
  generatorName: string | undefined,
  console: Consola
): TemplateEngine | undefined {
  if (!generatorName) {
    return undefined;
  }

  const name = generatorName.toLowerCase();

  const engine = TEMPLATE_ENGINES.find((e) => e.name == name);

  if (engine) {
    return engine;
  }

  throw tracedError(
    console,
    `Invalid generator engine: '${chalk.redBright(
      generatorName
    )}'. Use one of ${getEngineNames()}`
  );
}

export function findTemplateEngineFromExtension(
  extension: string,
  console: Consola
): TemplateEngine {
  const ext = extension.toLowerCase();

  const engine = TEMPLATE_ENGINES.find((e) => e.extensions.indexOf(ext) >= 0);

  if (engine) {
    return engine;
  }

  throw tracedError(
    console,
    `Unrecognized template extension: '${chalk.redBright(
      extension
    )}'. Try to specify an explicit engine from the following list: ${getEngineNames()}`
  );
}
