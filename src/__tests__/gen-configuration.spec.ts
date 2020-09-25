import consola from 'consola';
import fs from 'fs-extra';
import {
  createGeneratorSystemConfig,
  readGeneratorSystemConfig,
} from '../gen-configuration';

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

function createCodedError(message: string, code: string) {
  const error = new Error(message)
  Object.defineProperty(error, 'code', {
    get: () => code,
  })
  return error
}

function mockReadFileFor(filePath: string, content: string) {
  const readFile = (fs.readFile as any) as jest.Mock<Promise<string>, [string, string]>
  readFile.mockReset()

  readFile.mockImplementation(async (path, _encoding) => {
    if (path === filePath) {
      return content
    } else {
      throw createCodedError('', 'ENOENT')
    }
  })

  return readFile
}

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
        const readFile = mockReadFileFor('.pcgen.json', JSON.stringify(dummyConfiguration))

        const config = await readGeneratorSystemConfig({}, consola)
        
        expect(readFile).toHaveBeenCalledTimes(1)
        expect(readFile).toHaveBeenCalledWith('.pcgen.json', 'utf-8')
        expect(config).toEqual(dummyConfiguration)
      });
    });

    describe('when .pcgen.json is available and invalid', () => {
      it('should call readFile once and throw an error indicating error reading configuration', async () => {
        const readFile = mockReadFileFor('.pcgen.json', "Invalid JSON content")

        const configPromise = readGeneratorSystemConfig({}, consola)

        await expect(configPromise).rejects.toThrowError(/readGeneratorSystemConfig: Error reading generator configuration from file '.pcgen.json'/g)
        expect(readFile).toHaveBeenCalledTimes(1)
        expect(readFile).toHaveBeenCalledWith('.pcgen.json', 'utf-8')
      });
    });

    describe('when .pcgen is available and valid', () => {
      it('should call readFile twice and return the proper configuration', async () => {
        const readFile = mockReadFileFor('.pcgen', JSON.stringify(dummyConfiguration))

        const config = await readGeneratorSystemConfig({}, consola)
        
        expect(readFile).toHaveBeenCalledTimes(2)
        expect(readFile).toHaveBeenNthCalledWith(1, '.pcgen.json', 'utf-8')
        expect(readFile).toHaveBeenNthCalledWith(2, '.pcgen', 'utf-8')
        expect(config).toEqual(dummyConfiguration)
      });
    });

    describe('when .pcgen is available and invalid', () => {
      it('should call readFile twice and throw an error indicating error reading configuration', async () => {
        const readFile = mockReadFileFor('.pcgen', "Invalid JSON content")

        const configPromise = readGeneratorSystemConfig({}, consola)

        await expect(configPromise).rejects.toThrowError(/readGeneratorSystemConfig: Error reading generator configuration from file '.pcgen'/g)
        expect(readFile).toHaveBeenCalledTimes(2)
        expect(readFile).toHaveBeenNthCalledWith(1, '.pcgen.json', 'utf-8')
        expect(readFile).toHaveBeenNthCalledWith(2, '.pcgen', 'utf-8')
      });
    });

    describe('when .pcgenrc is available and valid', () => {
      it('should call readFile three times and return the proper configuration', async () => {
        const readFile = mockReadFileFor('.pcgenrc', JSON.stringify(dummyConfiguration))

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
        const readFile = mockReadFileFor('.pcgenrc', "Invalid JSON content")

        const configPromise = readGeneratorSystemConfig({}, consola)

        await expect(configPromise).rejects.toThrowError(/readGeneratorSystemConfig: Error reading generator configuration from file '.pcgenrc'/g)
        expect(readFile).toHaveBeenCalledTimes(3)
        expect(readFile).toHaveBeenNthCalledWith(1, '.pcgen.json', 'utf-8')
        expect(readFile).toHaveBeenNthCalledWith(2, '.pcgen', 'utf-8')
        expect(readFile).toHaveBeenNthCalledWith(3, '.pcgenrc', 'utf-8')
      });
    });

    describe('when no config file is available', () => {
      it('should call readFile three times and return the default configuration', async () => {
        const readFile = mockReadFileFor('other-file.txt', "Won't be read anyway")

        const config = await readGeneratorSystemConfig({}, consola)
        
        expect(readFile).toHaveBeenCalledTimes(3)
        expect(readFile).toHaveBeenNthCalledWith(1, '.pcgen.json', 'utf-8')
        expect(readFile).toHaveBeenNthCalledWith(2, '.pcgen', 'utf-8')
        expect(readFile).toHaveBeenNthCalledWith(3, '.pcgenrc', 'utf-8')
        expect(config).toEqual(createGeneratorSystemConfig({}))
      });
    });
  })
  
  jest.fn().mockImplementation()
});
