import consola from 'consola';
import { createExtensionBasedPluginRegistry } from '../plugins';
import { haveRegex } from './test-utils';

describe('createExtensionBasedPluginRegistry', () => {
  beforeAll(() => {
    consola.wrapAll();
  });
  beforeEach(() => {
    consola.mockTypes(() => jest.fn());
  });

  it('should be a function', () =>
    expect(createExtensionBasedPluginRegistry).toEqual(expect.any(Function)));

  describe('When given no plugins', () => {
    it('should return empty map of names and extensions', () => {
      const { byName, byExtension } = createExtensionBasedPluginRegistry(
        'logPrefix',
        'plugin',
        [],
        []
      );

      expect(byName.size).toBe(0);
      expect(byExtension.size).toBe(0);
      expect(consola.trace).not.toHaveBeenCalled();
    });
  });

  describe('When given a plugin with name and no extensions', () => {
    it('should return a name map containing given plugin', () => {
      const plugin = {
        name: 'my-plugin-name',
      };

      const { byName, byExtension } = createExtensionBasedPluginRegistry(
        'logPrefix',
        'plugin type',
        [plugin],
        []
      );

      expect(byName.size).toBe(1);
      expect(byName.get(plugin.name)).toBe(plugin);
      expect(byExtension.size).toBe(0);
      expect(consola.trace).toHaveBeenCalledTimes(1);
      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(/logPrefix: Plugin type .*'.*my-plugin-name.*'.*\./)
      );
    });
  });

  describe('When given a plugin with name and empty extensions', () => {
    it('should return a name map containing given plugin', () => {
      const plugin = {
        name: 'my-plugin-name',
        extensions: [],
      };

      const { byName, byExtension } = createExtensionBasedPluginRegistry(
        'logPrefix',
        'plugin type',
        [plugin],
        []
      );

      expect(byName.size).toBe(1);
      expect(byName.get(plugin.name)).toBe(plugin);
      expect(byExtension.size).toBe(0);
      expect(consola.trace).toHaveBeenCalledTimes(1);
      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(/logPrefix: Plugin type .*'.*my-plugin-name.*'.*\./)
      );
    });
  });

  describe('When given a plugin with name and one extension', () => {
    it('should return a name/ext map containing given plugin', () => {
      const plugin = {
        name: 'my-plugin-name',
        extensions: ['.plg'],
      };

      const { byName, byExtension } = createExtensionBasedPluginRegistry(
        'logPrefix',
        'plugin type',
        [plugin],
        []
      );

      expect(byName.size).toBe(1);
      expect(byName.get(plugin.name)).toBe(plugin);
      expect(byExtension.size).toBe(1);
      expect(byExtension.get(plugin.extensions[0])).toBe(plugin);
      expect(consola.trace).toHaveBeenCalledTimes(1);
      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(
          /logPrefix: Plugin type .*'.*my-plugin-name.*'.*for extensions: .*\.plg.*\./
        )
      );
    });
  });

  describe('When given a plugin with name and multiple extensions', () => {
    it('should return a name/ext map containing given plugin', () => {
      const plugin = {
        name: 'my-plugin-name',
        extensions: ['.plg', '.ppp', '.lll', '.ggg'],
      };

      const { byName, byExtension } = createExtensionBasedPluginRegistry(
        'logPrefix',
        'plugin type',
        [plugin],
        []
      );

      expect(byName.size).toBe(1);
      expect(byName.get(plugin.name)).toBe(plugin);
      expect(byExtension.size).toBe(4);
      expect(byExtension.get(plugin.extensions[0])).toBe(plugin);
      expect(byExtension.get(plugin.extensions[1])).toBe(plugin);
      expect(byExtension.get(plugin.extensions[2])).toBe(plugin);
      expect(byExtension.get(plugin.extensions[3])).toBe(plugin);
      expect(consola.trace).toHaveBeenCalledTimes(1);
      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(
          /logPrefix: Plugin type .*'.*my-plugin-name.*'.*for extensions: .*\.plg.*,.*\.ppp.*,.*\.lll.*,.*\.ggg.*\./
        )
      );
    });
  });

  describe('When given plugins with different names', () => {
    it('should return a name/ext map containing given plugins', () => {
      const plugins = [
        {
          name: 'plugin1',
        },
        {
          name: 'plugin2',
        },
        {
          name: 'plugin3',
        },
      ];

      const { byName } = createExtensionBasedPluginRegistry(
        'logPrefix',
        'plugin type',
        plugins,
        []
      );

      expect(byName.size).toBe(plugins.length);
      expect(byName.get(plugins[0].name)).toBe(plugins[0]);
      expect(byName.get(plugins[1].name)).toBe(plugins[1]);
      expect(byName.get(plugins[2].name)).toBe(plugins[2]);
      expect(consola.trace).toHaveBeenCalledTimes(3);
      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(/logPrefix: Plugin type .*'.*plugin1.*'.*\./)
      );
      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(/logPrefix: Plugin type .*'.*plugin2.*'.*\./)
      );
      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(/logPrefix: Plugin type .*'.*plugin3.*'.*\./)
      );
    });
  });

  describe('When given plugins with different extensions', () => {
    it('should return a name/ext map containing given plugins', () => {
      const plugins = [
        {
          name: 'plugin1',
          extensions: ['.p1', '.pp1'],
        },
        {
          name: 'plugin2',
          extensions: ['.p2', '.pp2'],
        },
        {
          name: 'plugin3',
          extensions: ['.p3', '.pp3'],
        },
      ];

      const { byExtension } = createExtensionBasedPluginRegistry(
        'logPrefix',
        'plugin type',
        plugins,
        []
      );

      expect(byExtension.size).toBe(plugins.length * 2);
      expect(byExtension.get(plugins[0].extensions[0])).toBe(plugins[0]);
      expect(byExtension.get(plugins[0].extensions[1])).toBe(plugins[0]);
      expect(byExtension.get(plugins[1].extensions[0])).toBe(plugins[1]);
      expect(byExtension.get(plugins[1].extensions[1])).toBe(plugins[1]);
      expect(byExtension.get(plugins[2].extensions[0])).toBe(plugins[2]);
      expect(byExtension.get(plugins[2].extensions[1])).toBe(plugins[2]);
      expect(consola.trace).toHaveBeenCalledTimes(3);
      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(
          /logPrefix: Plugin type .*'.*plugin1.*'.*for extensions: .*\.p1.*,.*\.pp1.*\./
        )
      );
      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(
          /logPrefix: Plugin type .*'.*plugin2.*'.*for extensions: .*\.p2.*,.*\.pp2.*\./
        )
      );
      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(
          /logPrefix: Plugin type .*'.*plugin3.*'.*for extensions: .*\.p3.*,.*\.pp3.*\./
        )
      );
    });
  });

  describe('When given plugins with duplicate names', () => {
    it('should return a name/ext map containing de-duplicated plugins and should log a warning per duplication', () => {
      const plugins = [
        {
          name: 'plugin1',
        },
        {
          name: 'plugin2',
        },
        {
          name: 'plugin1',
        },
        {
          name: 'plugin2',
        },
        {
          name: 'plugin3',
        },
      ];

      const { byName } = createExtensionBasedPluginRegistry(
        'logPrefix',
        'plugin type',
        plugins,
        []
      );

      expect(byName.size).toBe(3);
      expect(byName.get(plugins[0].name)).toBe(plugins[0]);
      expect(byName.get(plugins[1].name)).toBe(plugins[1]);
      expect(byName.get(plugins[2].name)).toBe(plugins[0]);
      expect(byName.get(plugins[3].name)).toBe(plugins[1]);
      expect(byName.get(plugins[4].name)).toBe(plugins[4]);

      expect(consola.trace).toHaveBeenCalledTimes(plugins.length);
      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(/logPrefix: Plugin type .*'.*plugin1.*'.*\./)
      );
      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(/logPrefix: Plugin type .*'.*plugin2.*'.*\./)
      );
      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(/logPrefix: Plugin type .*'.*plugin3.*'.*\./)
      );

      expect(consola.warn).toHaveBeenCalledTimes(2);
      expect(consola.warn).toHaveBeenCalledWith(
        haveRegex(/There are multiple plugin types with name '.*plugin1.*'/)
      );
      expect(consola.warn).toHaveBeenCalledWith(
        haveRegex(/There are multiple plugin types with name '.*plugin2.*'/)
      );
    });
  });

  describe('When given plugins with duplicate extensions', () => {
    it('should return a name/ext map containing de-duplicated plugins and should log a warning per duplication', () => {
      const plugins = [
        {
          name: 'plugin1',
          extensions: ['.p1', '.pp1', '.ppp1'],
        },
        {
          name: 'plugin2',
          extensions: ['.p2', '.p1', '.p3'],
        },
        {
          name: 'plugin3',
          extensions: ['.p1', '.p2', '.p3'],
        },
      ];

      const { byExtension } = createExtensionBasedPluginRegistry(
        'logPrefix',
        'plugin type',
        plugins,
        []
      );

      expect(byExtension.size).toBe(5);
      expect(byExtension.get(plugins[0].extensions[0])).toBe(plugins[0]);
      expect(byExtension.get(plugins[0].extensions[1])).toBe(plugins[0]);
      expect(byExtension.get(plugins[0].extensions[2])).toBe(plugins[0]);
      expect(byExtension.get(plugins[1].extensions[0])).toBe(plugins[1]);
      expect(byExtension.get(plugins[1].extensions[1])).toBe(plugins[0]);
      expect(byExtension.get(plugins[1].extensions[2])).toBe(plugins[1]);
      expect(byExtension.get(plugins[2].extensions[0])).toBe(plugins[0]);
      expect(byExtension.get(plugins[2].extensions[1])).toBe(plugins[1]);
      expect(byExtension.get(plugins[2].extensions[2])).toBe(plugins[1]);

      expect(consola.trace).toHaveBeenCalledTimes(3);
      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(
          /logPrefix: Plugin type .*'.*plugin1.*'.*for extensions: .*\.p1.*,.*\.pp1.*,.*\.ppp1.*\./
        )
      );
      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(
          /logPrefix: Plugin type .*'.*plugin2.*'.*for extensions: .*\.p2.*,.*\.p1.*,.*\.p3.*\./
        )
      );
      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(
          /logPrefix: Plugin type .*'.*plugin3.*'.*for extensions: .*\.p1.*,.*\.p2.*,.*\.p3.*\./
        )
      );

      expect(consola.warn).toHaveBeenCalledTimes(4);
      expect(consola.warn).toHaveBeenCalledWith(
        haveRegex(/There are multiple plugin types with extension '.*\.p1.*'/)
      );
      expect(consola.warn).toHaveBeenCalledWith(
        haveRegex(/There are multiple plugin types with extension '.*\.p2.*'/)
      );
      expect(consola.warn).toHaveBeenCalledWith(
        haveRegex(/There are multiple plugin types with extension '.*\.p3.*'/)
      );
    });
  });

  describe('When given default plugins with different names', () => {
    it('should return a name/ext map containing given plugins', () => {
      const plugins = [
        {
          name: 'plugin1',
        },
        {
          name: 'plugin2',
        },
        {
          name: 'plugin3',
        },
      ];

      const { byName } = createExtensionBasedPluginRegistry(
        'logPrefix',
        'plugin type',
        [],
        plugins
      );

      expect(byName.size).toBe(plugins.length);
      expect(byName.get(plugins[0].name)).toBe(plugins[0]);
      expect(byName.get(plugins[1].name)).toBe(plugins[1]);
      expect(byName.get(plugins[2].name)).toBe(plugins[2]);
      expect(consola.trace).toHaveBeenCalledTimes(3);
      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(/logPrefix: Default plugin type .*'.*plugin1.*'.*\./)
      );
      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(/logPrefix: Default plugin type .*'.*plugin2.*'.*\./)
      );
      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(/logPrefix: Default plugin type .*'.*plugin3.*'.*\./)
      );
    });
  });

  describe('When given default plugins with different extensions', () => {
    it('should return a name/ext map containing given plugins', () => {
      const plugins = [
        {
          name: 'plugin1',
          extensions: ['.p1', '.pp1'],
        },
        {
          name: 'plugin2',
          extensions: ['.p2', '.pp2'],
        },
        {
          name: 'plugin3',
          extensions: ['.p3', '.pp3'],
        },
      ];

      const { byExtension } = createExtensionBasedPluginRegistry(
        'logPrefix',
        'plugin type',
        [],
        plugins
      );

      expect(byExtension.size).toBe(plugins.length * 2);
      expect(byExtension.get(plugins[0].extensions[0])).toBe(plugins[0]);
      expect(byExtension.get(plugins[0].extensions[1])).toBe(plugins[0]);
      expect(byExtension.get(plugins[1].extensions[0])).toBe(plugins[1]);
      expect(byExtension.get(plugins[1].extensions[1])).toBe(plugins[1]);
      expect(byExtension.get(plugins[2].extensions[0])).toBe(plugins[2]);
      expect(byExtension.get(plugins[2].extensions[1])).toBe(plugins[2]);
      expect(consola.trace).toHaveBeenCalledTimes(3);
      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(
          /logPrefix: Default plugin type .*'.*plugin1.*'.*for extensions: .*\.p1.*,.*\.pp1.*\./
        )
      );
      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(
          /logPrefix: Default plugin type .*'.*plugin2.*'.*for extensions: .*\.p2.*,.*\.pp2.*\./
        )
      );
      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(
          /logPrefix: Default plugin type .*'.*plugin3.*'.*for extensions: .*\.p3.*,.*\.pp3.*\./
        )
      );
    });
  });

  describe('When given default plugins with duplicate names', () => {
    it('should return a name/ext map containing de-duplicated plugins and should log a warning per duplication', () => {
      const plugins = [
        {
          name: 'plugin1',
        },
        {
          name: 'plugin2',
        },
        {
          name: 'plugin1',
        },
        {
          name: 'plugin2',
        },
        {
          name: 'plugin3',
        },
      ];

      const { byName } = createExtensionBasedPluginRegistry(
        'logPrefix',
        'plugin type',
        [],
        plugins
      );

      expect(byName.size).toBe(3);
      expect(byName.get(plugins[0].name)).toBe(plugins[0]);
      expect(byName.get(plugins[1].name)).toBe(plugins[1]);
      expect(byName.get(plugins[2].name)).toBe(plugins[0]);
      expect(byName.get(plugins[3].name)).toBe(plugins[1]);
      expect(byName.get(plugins[4].name)).toBe(plugins[4]);

      expect(consola.trace).toHaveBeenCalledTimes(plugins.length + 2);
      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(/logPrefix: Default plugin type .*'.*plugin1.*'.*\./)
      );
      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(/logPrefix: Default plugin type .*'.*plugin2.*'.*\./)
      );
      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(/logPrefix: Default plugin type .*'.*plugin3.*'.*\./)
      );

      expect(consola.warn).toHaveBeenCalledTimes(0);
      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(/There are multiple plugin types with name '.*plugin1.*'/)
      );
      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(/There are multiple plugin types with name '.*plugin2.*'/)
      );
    });
  });

  describe('When given default plugins with duplicate extensions', () => {
    it('should return a name/ext map containing de-duplicated plugins and should log a warning per duplication', () => {
      const plugins = [
        {
          name: 'plugin1',
          extensions: ['.p1', '.pp1', '.ppp1'],
        },
        {
          name: 'plugin2',
          extensions: ['.p2', '.p1', '.p3'],
        },
        {
          name: 'plugin3',
          extensions: ['.p1', '.p2', '.p3'],
        },
      ];

      const { byExtension } = createExtensionBasedPluginRegistry(
        'logPrefix',
        'plugin type',
        [],
        plugins
      );

      expect(byExtension.size).toBe(5);
      expect(byExtension.get(plugins[0].extensions[0])).toBe(plugins[0]);
      expect(byExtension.get(plugins[0].extensions[1])).toBe(plugins[0]);
      expect(byExtension.get(plugins[0].extensions[2])).toBe(plugins[0]);
      expect(byExtension.get(plugins[1].extensions[0])).toBe(plugins[1]);
      expect(byExtension.get(plugins[1].extensions[1])).toBe(plugins[0]);
      expect(byExtension.get(plugins[1].extensions[2])).toBe(plugins[1]);
      expect(byExtension.get(plugins[2].extensions[0])).toBe(plugins[0]);
      expect(byExtension.get(plugins[2].extensions[1])).toBe(plugins[1]);
      expect(byExtension.get(plugins[2].extensions[2])).toBe(plugins[1]);

      expect(consola.trace).toHaveBeenCalledTimes(3 + 4);
      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(
          /logPrefix: Default plugin type .*'.*plugin1.*'.*for extensions: .*\.p1.*,.*\.pp1.*,.*\.ppp1.*\./
        )
      );
      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(
          /logPrefix: Default plugin type .*'.*plugin2.*'.*for extensions: .*\.p2.*,.*\.p1.*,.*\.p3.*\./
        )
      );
      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(
          /logPrefix: Default plugin type .*'.*plugin3.*'.*for extensions: .*\.p1.*,.*\.p2.*,.*\.p3.*\./
        )
      );

      expect(consola.warn).toHaveBeenCalledTimes(0);
      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(/There are multiple plugin types with extension '.*\.p1.*'/)
      );
      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(/There are multiple plugin types with extension '.*\.p2.*'/)
      );
      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(/There are multiple plugin types with extension '.*\.p3.*'/)
      );
    });
  });
});
