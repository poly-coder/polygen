import consola from 'consola';
import {
  createLogPrefix,
  sprintBad,
  sprintGood,
} from './logging';
import {
  IPlugginExtensions,
  ITemplateHelpersConfig,
  ITemplateHelpers,
} from './types';

export const defaultTemplateHelpers: ITemplateHelpersConfig[] = [
  {
    name: 'env',
    value: process.env,
  },
  {
    name: 'case',
    create: async () => {
      const changeCase = await import('change-case');
      return changeCase;
    },
  },
  {
    name: 'inflection',
    create: async () => {
      const inflection = await import('inflection');
      return inflection.default;
    },
  },
  {
    name: 'humanize',
    create: async () => {
      const humanize = await import('humanize-plus');
      return humanize.default;
    },
  },
];

export function createFallbackTemplateHelpers(): ITemplateHelpers {
  return {
    createHelpers: () => Promise.resolve({}),
  };
}

export function createTemplateHelpers(
  config: IPlugginExtensions,
  fallbackTemplateHelpers: ITemplateHelpers,
  loadDefaultPlugins: boolean
): ITemplateHelpers {
  const logPrefix = createLogPrefix('createTemplateHelpers');

  const byName = new Map<string, ITemplateHelpersConfig>();

  function addHelper(runner: ITemplateHelpersConfig, isDefault: boolean) {
    consola.trace(
      `${logPrefix}: ${isDefault ? 'Default helper' : 'Helper'} '${sprintGood(
        runner.name
      )}'`
    );

    const warnLogger = isDefault ? consola.trace : consola.warn;

    if (byName.has(runner.name)) {
      warnLogger(
        `There are multiple template helpers with name '${sprintBad(
          runner.name
        )}'`
      );
    } else {
      byName.set(runner.name, runner);
    }
  }

  for (const helper of config.helpers ?? []) {
    addHelper(helper, false);
  }

  for (const helper of loadDefaultPlugins === false
    ? []
    : defaultTemplateHelpers) {
    addHelper(helper, true);
  }

  return {
    createHelpers: async () => {
      let helpers = await fallbackTemplateHelpers.createHelpers();

      for (const [name, helper] of byName.entries()) {
        const helperValue = helper.create ? (await helper.create()) : helper.value;
        if (helperValue === undefined) {
          consola.warn(`Helper '${sprintBad(name)}' did not return any meaningful value`);
        } else {
          helpers[name] = helperValue;
        }
      }
    },
  };
}
