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
  IFileLocator,
  IPluginExtensions,
  ITemplateRunnerConfig,
  ITemplateRunners,
} from './types';

export const defaultTemplateRunners: ITemplateRunnerConfig[] = [
  {
    name: 'module',
    extensions: ['.js'],
    fromPath: async (filePath, context, engineOptions) => {
      const loadedModule = await import(filePath);

      if (typeof loadedModule.default !== 'function') {
        consola.trace(
          `Module at '${sprintBad(
            filePath
          )}' does not exports a default function`
        );
        return;
      }

      return await loadedModule.default(context, engineOptions);
    },
  },
  {
    name: 'ejs',
    extensions: ['.ejs'],
    fromPath: async (filePath, context, engineOptions) => {
      const ejs = await import('ejs');
      return await ejs.renderFile(filePath, context, engineOptions);
    },
    fromContent: async (content, context, engineOptions) => {
      const ejs = await import('ejs');
      return await ejs.render(content, context, engineOptions);
    },
  },
  {
    name: 'liquid',
    extensions: ['.liquid'],
    fromPath: async (filePath, context, engineOptions) => {
      const liquid = await import('liquidjs');
      const engine = new liquid.Liquid(engineOptions);
      return await engine.renderFile(filePath, context, engineOptions);
    },
    fromContent: async (content, context, engineOptions) => {
      const liquid = await import('liquidjs');
      const engine = new liquid.Liquid(engineOptions);
      return await engine.parseAndRender(content, context, engineOptions);
    },
  },
  {
    name: 'nunjucks',
    extensions: ['.nunjucks', '.njk'],
    fromPath: async (filePath, context, engineOptions) => {
      const nunjucks = await import('nunjucks');
      const environment = nunjucks.configure(engineOptions ?? {});
      return environment.render(filePath, context);
    },
    fromContent: async (content, context, engineOptions) => {
      const nunjucks = await import('nunjucks');
      const environment = nunjucks.configure(engineOptions ?? {});
      return environment.renderString(content, context);
    },
  },
  {
    name: 'pug',
    extensions: ['.pug'],
    fromPath: async (filePath, context, engineOptions) => {
      const pug = await import('pug');
      const compiled = pug.compileFile(filePath, engineOptions);
      return compiled(context);
    },
    fromContent: async (content, context, engineOptions) => {
      const pug = await import('pug');
      const compiled = pug.compile(content, engineOptions);
      return compiled(context);
    },
  },
  {
    name: 'handlebars',
    extensions: ['.handlebars', '.hbs'],
    fromContent: async (content, context, engineOptions) => {
      const handlebars = await import('handlebars');
      const compiled = await handlebars.compile(content, engineOptions);
      return compiled(context, engineOptions);
    },
  },
  {
    name: 'mustache',
    extensions: ['.mustache'],
    fromContent: async (content, context, engineOptions) => {
      const mustache = await import('mustache');
      const partials = engineOptions?.partials;
      const tags = engineOptions?.tags;
      return mustache.render(content, context, partials, tags);
    },
  },
];

export function createFallbackTemplateRunners(
  fileLocator: IFileLocator
): ITemplateRunners {
  return {
    ...fileLocator,
    renderTemplateFromContent: async (_content, _context, options) => {
      consola.error(
        `There is no template runner registered for name '${sprintBad(
          options.engine
        )}'`
      );
      return undefined;
    },
    renderTemplateFromPath: async (filePath, _context, options) => {
      consola.error(
        `There is no template runner registered for name '${sprintBad(
          options?.engine ?? '(unspecified)'
        )}' or extension '${sprintBad(path.extname(filePath))}'`
      );
      return undefined;
    },
  };
}

export function createTemplateRunners(
  config: IPluginExtensions,
  fallbackTemplateRunners: ITemplateRunners,
  loadDefaultPlugins: boolean
): ITemplateRunners {
  const logPrefix = createLogPrefix('createTemplateRunners');

  const byName = new Map<string, ITemplateRunnerConfig>();
  const byExtension = new Map<string, ITemplateRunnerConfig>();

  function addRunner(runner: ITemplateRunnerConfig, isDefault: boolean) {
    const extensions = runner.extensions
      ? sprintGoodList(runner.extensions)
      : sprintBad('None');
    consola.trace(
      `${logPrefix}: ${
        isDefault ? 'Default template' : 'Template'
      } runner '${sprintGood(runner.name)}' for extensions: ${extensions}`
    );

    const warnLogger = isDefault ? consola.trace : consola.warn;

    if (byName.has(runner.name)) {
      warnLogger(
        `There are multiple template runners with name '${sprintBad(
          runner.name
        )}'`
      );
    } else {
      byName.set(runner.name, runner);
    }

    for (const extension of runner.extensions ?? []) {
      if (byExtension.has(extension)) {
        warnLogger(
          `There are multiple template runners with extension '${sprintBad(
            extension
          )}'`
        );
      } else {
        byExtension.set(extension, runner);
      }
    }
  }

  for (const runner of config.engines ?? []) {
    addRunner(runner, false);
  }

  for (const runner of loadDefaultPlugins === false
    ? []
    : defaultTemplateRunners) {
    addRunner(runner, true);
  }

  return {
    ...fallbackTemplateRunners,

    renderTemplateFromContent: async (content, context, options) => {
      const { engine, engineOptions } = options;

      const runner = byName.get(engine);

      if (!runner) {
        return await fallbackTemplateRunners.renderTemplateFromContent(
          content,
          context,
          options
        );
      }

      try {
        if (runner.fromContent) {
          const text = await runner.fromContent(
            content,
            context,
            engineOptions
          );

          return text;
        }

        consola.error(
          `Template runner '${sprintBad(
            engine
          )}' cannot load from content. You need to pass the filePath.`
        );
        return undefined;
      } catch (error) {
        consola.error(`Error running template of type '${sprintBad(engine)}'`);
        consola.trace(error);
        return undefined;
      }
    },

    renderTemplateFromPath: async (filePath, context, options) => {
      const { engine, engineOptions } = options ?? {};

      const extension = path.extname(filePath);

      const runner = engine ? byName.get(engine) : byExtension.get(extension);

      if (!runner) {
        return await fallbackTemplateRunners.renderTemplateFromPath(
          filePath,
          context,
          options
        );
      }

      try {
        if (!(await fsExistsAsFile(filePath))) {
          consola.error(
            `Template file '${sprintBad(filePath)}' does not exist`
          );
          return undefined;
        }

        if (runner.fromPath) {
          return await runner.fromPath(filePath, context, engineOptions);
        }

        if (runner.fromContent) {
          const content = await fsReadFileContent(filePath);

          if (content === undefined) {
            consola.error(
              `Cannot read content of template file '${sprintBad(filePath)}'.`
            );
            return undefined;
          }

          return await runner.fromContent(content, context, engineOptions);
        }

        consola.error(
          `Template runner '${sprintBad(
            runner.name
          )}' does not define any load function.`
        );
        return undefined;
      } catch (error) {
        consola.error(
          `Error template runner of type '${sprintBad(runner.name)}'`
        );
        consola.trace(error);
        return undefined;
      }
    },
  };
}
