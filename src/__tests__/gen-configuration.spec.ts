import consola from 'consola';
import fs from 'fs-extra';
import path from 'path';
import {
  createConfigHelpers,
  createGeneratorSystemConfig,
  readGeneratorSystemConfig,
} from '../gen-configuration';
import { GeneratorSystemConfig } from '../gen-types';
import { mockReadFileFor } from './test-utils';

jest.mock('fs-extra');

const dummyConfiguration = {
  basePath: 'base-path',
  commandsFolder: 'cmds',
  cwd: '../current',
  defaultCommand: 'create',
  generatorFolder: 'gen',
  initAssets: '_assets',
  pcgenFolder: '__pcgen',
  searchPaths: ['/c/mnt/users/myself/.pcgen'],
  templatesFolder: 'tmpls',
};

describe('createGeneratorSystemConfig', () => {
  beforeAll(() => {
    consola.wrapAll();
  });
  beforeEach(() => {
    consola.mockTypes(() => jest.fn());
  });

  it('is a function', async () =>
    expect(typeof createGeneratorSystemConfig).toBe('function'));

  describe('when given no configuration', () => {
    it('it should return the default configurations', () => {
      const config = createGeneratorSystemConfig();
      expect(config).toEqual({
        basePath: '.',
        commandsFolder: 'commands',
        cwd: '.',
        defaultCommand: 'new',
        generatorFolder: 'generator',
        initAssets: 'assets',
        pcgenFolder: '_pcgen',
        searchPaths: [],
        templatesFolder: 'templates',
      });
    });
  });

  describe('when given partial configuration', () => {
    it('it should return the merged configurations', () => {
      const config = createGeneratorSystemConfig({
        commandsFolder: 'cmds',
        defaultCommand: 'create',
        generatorFolder: 'gen',
        pcgenFolder: '__pcgen',
        searchPaths: ['/c/mnt/users/myself/.pcgen'],
        templatesFolder: 'tmpls',
      });

      expect(config).toEqual({
        basePath: '.',
        commandsFolder: 'cmds',
        cwd: '.',
        defaultCommand: 'create',
        generatorFolder: 'gen',
        initAssets: 'assets',
        pcgenFolder: '__pcgen',
        searchPaths: ['/c/mnt/users/myself/.pcgen'],
        templatesFolder: 'tmpls',
      });
    });
  });

  describe('when given full configuration', () => {
    it('it should return the same configuration', () => {
      const config = createGeneratorSystemConfig(dummyConfiguration);

      expect(config).toEqual({
        basePath: 'base-path',
        commandsFolder: 'cmds',
        cwd: '../current',
        defaultCommand: 'create',
        generatorFolder: 'gen',
        initAssets: '_assets',
        pcgenFolder: '__pcgen',
        searchPaths: ['/c/mnt/users/myself/.pcgen'],
        templatesFolder: 'tmpls',
      });
    });
  });
});

describe('readGeneratorSystemConfig', () => {
  beforeAll(() => {
    consola.wrapAll();
  });
  beforeEach(() => {
    consola.mockTypes(() => jest.fn());
  });

  it('is a function', async () =>
    expect(typeof readGeneratorSystemConfig).toBe('function'));

  describe('when given no custom --config-file option', () => {
    describe('when .pcgen.json is available and valid', () => {
      it('should call readFile once and return the proper configuration', async () => {
        const readFile = mockReadFileFor(fs.readFile, '.pcgen.json', JSON.stringify(dummyConfiguration))

        const config = await readGeneratorSystemConfig({}, consola)
        
        expect(readFile).toHaveBeenCalledTimes(1)
        expect(readFile).toHaveBeenCalledWith('.pcgen.json', 'utf-8')
        expect(config).toEqual(dummyConfiguration)
      });
    });

    describe('when .pcgen.json is available and invalid', () => {
      it('should call readFile once and throw an error indicating error reading configuration', async () => {
        const readFile = mockReadFileFor(fs.readFile, '.pcgen.json', "Invalid JSON content")

        const configPromise = readGeneratorSystemConfig({}, consola)

        await expect(configPromise).rejects.toThrowError(/readGeneratorSystemConfig: Error reading generator configuration from file '.pcgen.json'/g)
        expect(readFile).toHaveBeenCalledTimes(1)
        expect(readFile).toHaveBeenCalledWith('.pcgen.json', 'utf-8')
      });
    });

    describe('when .pcgen is available and valid', () => {
      it('should call readFile twice and return the proper configuration', async () => {
        const readFile = mockReadFileFor(fs.readFile, '.pcgen', JSON.stringify(dummyConfiguration))

        const config = await readGeneratorSystemConfig({}, consola)
        
        expect(readFile).toHaveBeenCalledTimes(2)
        expect(readFile).toHaveBeenNthCalledWith(1, '.pcgen.json', 'utf-8')
        expect(readFile).toHaveBeenNthCalledWith(2, '.pcgen', 'utf-8')
        expect(config).toEqual(dummyConfiguration)
      });
    });

    describe('when .pcgen is available and invalid', () => {
      it('should call readFile twice and throw an error indicating error reading configuration', async () => {
        const readFile = mockReadFileFor(fs.readFile, '.pcgen', "Invalid JSON content")

        const configPromise = readGeneratorSystemConfig({}, consola)

        await expect(configPromise).rejects.toThrowError(/readGeneratorSystemConfig: Error reading generator configuration from file '.pcgen'/g)
        expect(readFile).toHaveBeenCalledTimes(2)
        expect(readFile).toHaveBeenNthCalledWith(1, '.pcgen.json', 'utf-8')
        expect(readFile).toHaveBeenNthCalledWith(2, '.pcgen', 'utf-8')
      });
    });

    describe('when .pcgenrc is available and valid', () => {
      it('should call readFile three times and return the proper configuration', async () => {
        const readFile = mockReadFileFor(fs.readFile, '.pcgenrc', JSON.stringify(dummyConfiguration))

        const config = await readGeneratorSystemConfig({}, consola)
        
        expect(readFile).toHaveBeenCalledTimes(3)
        expect(readFile).toHaveBeenNthCalledWith(1, '.pcgen.json', 'utf-8')
        expect(readFile).toHaveBeenNthCalledWith(2, '.pcgen', 'utf-8')
        expect(readFile).toHaveBeenNthCalledWith(3, '.pcgenrc', 'utf-8')
        expect(config).toEqual(dummyConfiguration)
      });
    });

    describe('when .pcgenrc is available and invalid', () => {
      it('should call readFile three times and throw an error indicating error reading configuration', async () => {
        const readFile = mockReadFileFor(fs.readFile, '.pcgenrc', "Invalid JSON content")

        const configPromise = readGeneratorSystemConfig({}, consola)

        await expect(configPromise).rejects.toThrowError(/readGeneratorSystemConfig: Error reading generator configuration from file '.pcgenrc'/g)
        expect(readFile).toHaveBeenCalledTimes(3)
        expect(readFile).toHaveBeenNthCalledWith(1, '.pcgen.json', 'utf-8')
        expect(readFile).toHaveBeenNthCalledWith(2, '.pcgen', 'utf-8')
        expect(readFile).toHaveBeenNthCalledWith(3, '.pcgenrc', 'utf-8')
      });
    });

    describe('when no config file is available', () => {
      it('should call readFile three times and throw an error indicating configuration file was not found', async () => {
        const readFile = mockReadFileFor(fs.readFile, 'other-file.txt', "Won't be read anyway")

        const configPromise = readGeneratorSystemConfig({}, consola)

        await expect(configPromise).rejects.toThrowError(/readGeneratorSystemConfig: Generator configuration file NOT FOUND/g)
        expect(readFile).toHaveBeenCalledTimes(3)
        expect(readFile).toHaveBeenNthCalledWith(1, '.pcgen.json', 'utf-8')
        expect(readFile).toHaveBeenNthCalledWith(2, '.pcgen', 'utf-8')
        expect(readFile).toHaveBeenNthCalledWith(3, '.pcgenrc', 'utf-8')
      });
    });
  })

  describe('when given custom --config-file option', () => {
    describe('when .custom.pcgen.json is available and valid', () => {
      it('should call readFile once and return the proper configuration', async () => {
        const readFile = mockReadFileFor(fs.readFile, '.custom.pcgen.json', JSON.stringify(dummyConfiguration))

        const config = await readGeneratorSystemConfig({ configFile: '.custom.pcgen.json' }, consola)
        
        expect(readFile).toHaveBeenCalledTimes(1)
        expect(readFile).toHaveBeenCalledWith('.custom.pcgen.json', 'utf-8')
        expect(config).toEqual(dummyConfiguration)
      });
    });

    describe('when .custom.pcgen.json is available and invalid', () => {
      it('should call readFile once and throw an error indicating error reading configuration', async () => {
        const readFile = mockReadFileFor(fs.readFile, '.custom.pcgen.json', "Invalid JSON content")

        const configPromise = readGeneratorSystemConfig({ configFile: '.custom.pcgen.json' }, consola)

        await expect(configPromise).rejects.toThrowError(/readGeneratorSystemConfig: Error reading generator configuration from file '.custom.pcgen.json'/g)
        expect(readFile).toHaveBeenCalledTimes(1)
        expect(readFile).toHaveBeenNthCalledWith(1, '.custom.pcgen.json', 'utf-8')
      });
    });

    describe('when custom config file is not available', () => {
      it('should call readFile once and throw an error indicating configuration file was not found', async () => {
        const readFile = mockReadFileFor(fs.readFile, 'other-file.txt', "Won't be read anyway")

        const configPromise = readGeneratorSystemConfig({ configFile: '.custom.pcgen.json' }, consola)

        await expect(configPromise).rejects.toThrowError(/readGeneratorSystemConfig: Generator configuration file NOT FOUND/g)
        expect(readFile).toHaveBeenCalledTimes(1)
        expect(readFile).toHaveBeenNthCalledWith(1, '.custom.pcgen.json', 'utf-8')
      });
    });
  });
});

describe('createConfigHelpers', () => {
  beforeAll(() => {
    consola.wrapAll();
  });
  beforeEach(() => {
    consola.mockTypes(() => jest.fn());
  });
  
  it('is a function', async () =>
    expect(typeof createConfigHelpers).toBe('function'));

  describe('when called with default configuration', () => {
    let config: GeneratorSystemConfig = {
      basePath: 'base-path',
      cwd: 'cwd',
      commandsFolder: 'cmd',
      templatesFolder: 'tpl',
      defaultCommand: 'create',
      generatorFolder: 'gen',
      pcgenFolder: '_pcg',
      initAssets: 'ast',
      searchPaths: [],
    }

    it('it should return a value', () => {
      const helpers = createConfigHelpers(config)
      expect(helpers).not.toBeFalsy()
    });

    it('cwd should be the absolute path to Current Working Directory ', () => {
      const helpers = createConfigHelpers(config)
      expect(helpers.cwd).toBe(path.resolve(config.cwd))
    });

    it('baseFullPath should be the absolute path to Base Path ', () => {
      const helpers = createConfigHelpers(config)
      expect(helpers.baseFullPath).toBe(path.resolve(config.basePath))
    });

    it('pcgenPath should be the relative path to pcgen folder ', () => {
      const helpers = createConfigHelpers(config)
      expect(helpers.pcgenPath).toBe(path.join(config.basePath, config.pcgenFolder))
    });

    it('pcgenFullPath should be the absolute path to pcgen folder at Base Path', () => {
      const helpers = createConfigHelpers(config)
      expect(helpers.pcgenFullPath).toBe(path.join(helpers.baseFullPath, config.pcgenFolder))
    });
    
    it('atCwdFullPath should be a function', () => {
      const helpers = createConfigHelpers(config)
      expect(typeof helpers.atCwdFullPath).toBe('function')
    });

    it('atCwdFullPath should return the absolute path based on CWD', () => {
      const helpers = createConfigHelpers(config)
      expect(helpers.atCwdFullPath('relative/path')).toBe(path.join(helpers.cwd, 'relative/path'))
    });
    
    it('atPcgenPath should be a function', () => {
      const helpers = createConfigHelpers(config)
      expect(typeof helpers.atPcgenPath).toBe('function')
    });

    it('atPcgenPath should return the relative path based on pcgen folder', () => {
      const helpers = createConfigHelpers(config)
      expect(helpers.atPcgenPath('relative/path')).toBe(path.join(helpers.pcgenPath, 'relative/path'))
    });
    
    it('atPcgenFullPath should be a function', () => {
      const helpers = createConfigHelpers(config)
      expect(typeof helpers.atPcgenFullPath).toBe('function')
    });

    it('atPcgenFullPath should return the absolute path based on pcgen folder', () => {
      const helpers = createConfigHelpers(config)
      expect(helpers.atPcgenFullPath('relative/path')).toBe(path.join(helpers.pcgenFullPath, 'relative/path'))
    });
    
    it('atCommandsPath should be a function', () => {
      const helpers = createConfigHelpers(config)
      expect(typeof helpers.atCommandsPath).toBe('function')
    });

    it('atCommandsPath should return the absolute path based on given generator full path and config commands folder', () => {
      const helpers = createConfigHelpers(config)
      expect(helpers.atCommandsPath(helpers.atPcgenFullPath('my-generator'), 'my-command.js'))
        .toBe(path.join(helpers.pcgenFullPath, 'my-generator', config.commandsFolder, 'my-command.js'))
    });
    
    it('atTemplatesPath should be a function', () => {
      const helpers = createConfigHelpers(config)
      expect(typeof helpers.atTemplatesPath).toBe('function')
    });

    it('atTemplatesPath should return the absolute path based on given generator full path and config templates folder', () => {
      const helpers = createConfigHelpers(config)
      expect(helpers.atTemplatesPath(helpers.atPcgenFullPath('my-generator'), 'my-template.ejs'))
        .toBe(path.join(helpers.pcgenFullPath, 'my-generator', config.templatesFolder, 'my-template.ejs'))
    });
  });
});
