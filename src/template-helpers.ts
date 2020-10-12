import consola from 'consola';
import {
  createLogPrefix,
  sprintBad,
} from './logging';
import { createExtensionBasedPluginRegistry } from './plugins';
import {
  IPluginExtensions,
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
  config: IPluginExtensions,
  fallbackTemplateHelpers: ITemplateHelpers,
  loadDefaultPlugins: boolean
): ITemplateHelpers {
  const logPrefix = createLogPrefix('createTemplateHelpers');

  const { byName } = createExtensionBasedPluginRegistry<
    ITemplateHelpersConfig
  >(
    logPrefix,
    'template helper',
    config.loaders ?? [],
    loadDefaultPlugins === false ? [] : defaultTemplateHelpers
  );

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
