import consola from 'consola';
import { sentenceCase, noCase } from 'change-case';
import { pluralize, singularize } from 'inflection';
import { sprintBad, sprintGood, sprintGoodList } from './logging';
import { ExtensionBasedPlugin } from './types';

export function createExtensionBasedPluginRegistry<
  TPlugin extends ExtensionBasedPlugin
>(
  logPrefix: string,
  sentenceName: string,
  plugins: readonly TPlugin[],
  defaultPlugins: readonly TPlugin[]
): {
  byName: Map<string, TPlugin>;
  byExtension: Map<string, TPlugin>;
} {
  const haveAnyPlugin = plugins.length > 0 || defaultPlugins.length > 0;
  if (haveAnyPlugin) {
    consola.trace(`${logPrefix}: Loading ${noCase(pluralize(sentenceName))} plugins`)
  }

  const byName = new Map<string, TPlugin>();
  const byExtension = new Map<string, TPlugin>();

  function addPluginToRegistry(plugin: TPlugin, isDefault: boolean) {
    const extensions =
      plugin.extensions && plugin.extensions.length > 0
        ? ` for extensions: ${sprintGoodList(plugin.extensions)}`
        : '';

    consola.trace(
      `${logPrefix}: ${
        isDefault
          ? 'Default ' + noCase(singularize(sentenceName))
          : sentenceCase(singularize(sentenceName))
      } '${sprintGood(plugin.name)}'${extensions}.`
    );

    const warnLogger = isDefault ? consola.trace : consola.warn;

    if (byName.has(plugin.name)) {
      warnLogger(
        `There are multiple ${noCase(
          pluralize(sentenceName)
        )} with name '${sprintBad(plugin.name)}'`
      );
    } else {
      byName.set(plugin.name, plugin);
    }

    for (const extension of plugin.extensions ?? []) {
      if (byExtension.has(extension)) {
        warnLogger(
          `There are multiple ${noCase(
            pluralize(sentenceName)
          )} with extension '${sprintBad(extension)}'`
        );
      } else {
        byExtension.set(extension, plugin);
      }
    }
  }

  for (const plugin of plugins) {
    addPluginToRegistry(plugin, false);
  }

  for (const plugin of defaultPlugins) {
    addPluginToRegistry(plugin, true);
  }

  return {
    byName,
    byExtension,
  };
}
