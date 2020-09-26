import consola from 'consola';
// import fs from 'fs-extra';
// import path from 'path';
// import { joinPaths } from '../file-utils';
// import { createGeneratorSystemConfig } from '../gen-configuration';
// // import path from 'path';
import { createGeneratorsSystem } from '../gen-system';
// import { mockFileSystem } from './test-utils';

jest.mock('fs-extra');

describe('createGeneratorsSystem', () => {
  beforeAll(() => {
    consola.wrapAll();
  });
  beforeEach(() => {
    consola.mockTypes(() => jest.fn());
  });

  it('should be a function', () =>
    expect(typeof createGeneratorsSystem).toBe('function'));
});

/*
describe('createGeneratorsSystem', () => {
  beforeAll(() => {
    consola.wrapAll();
  });
  beforeEach(() => {
    consola.mockTypes(() => jest.fn());
  });

  it('should be a function', () =>
    expect(typeof createGeneratorsSystem).toBe('function'));

  it('when called no file access should happen', () => {
    const fileSystem = mockFileSystem(fs);
    const config = createGeneratorSystemConfig();
    createGeneratorsSystem(config, consola);
    fileSystem.hasNotBeenCalled();
  });

  describe('isInitialized', () => {
    it('should be a function', () => {
      const config = createGeneratorSystemConfig();
      const system = createGeneratorsSystem(config, consola);
      return expect(typeof system.isInitialized).toBe('function');
    });

    describe('when called in a fresh file system', () => {
      it('should return false', async () => {
        const config = createGeneratorSystemConfig({
          cwd: '/cwd',
          basePath: '/base',
        });
        const fileSystem = mockFileSystem(fs);
        const system = createGeneratorsSystem(config, consola);
        
        const actual = await system.isInitialized();

        expect(fileSystem.readFile).not.toHaveBeenCalled()
        expect(fileSystem.writeFile).not.toHaveBeenCalled()
        expect(fileSystem.readdir).not.toHaveBeenCalled()
        expect(fileSystem.ensureDir).not.toHaveBeenCalled()
        expect(fileSystem.stat).toHaveBeenCalledTimes(3)
        expect(fileSystem.stat).toHaveBeenNthCalledWith(1, path.resolve(path.join(config.cwd, '.pcgen.json')))
        expect(fileSystem.stat).toHaveBeenNthCalledWith(2, path.resolve(path.join(config.cwd, '.pcgen')))
        expect(fileSystem.stat).toHaveBeenNthCalledWith(3, path.resolve(path.join(config.cwd, '.pcgenrc')))
        return expect(actual).toBeFalsy();
      });
    });

    describe('when called in a file system with empty .pcgen.json config file', () => {
      it('should return true', async () => {
        const config = createGeneratorSystemConfig({
          cwd: '/cwd',
          basePath: '/base',
        });
        const fileSystem = mockFileSystem(fs, {
          stat: {
            [path.resolve(path.join(config.cwd, '.pcgen.json'))]: 'file',
          }
        });
        const system = createGeneratorsSystem(config, consola);
        
        const actual = await system.isInitialized();

        expect(fileSystem.readFile).not.toHaveBeenCalled()
        expect(fileSystem.writeFile).not.toHaveBeenCalled()
        expect(fileSystem.readdir).not.toHaveBeenCalled()
        expect(fileSystem.ensureDir).not.toHaveBeenCalled()
        expect(fileSystem.stat).toHaveBeenCalledTimes(1)
        expect(fileSystem.stat).toHaveBeenNthCalledWith(1, path.resolve(path.join(config.cwd, '.pcgen.json')))
        return expect(actual).toBeTruthy();
      });
    });

    describe('when called in a file system with empty .pcgen config file', () => {
      it('should return true', async () => {
        const config = createGeneratorSystemConfig({
          cwd: '/cwd',
          basePath: '/base',
        });
        const fileSystem = mockFileSystem(fs, {
          stat: {
            [path.resolve(path.join(config.cwd, '.pcgen'))]: 'file',
          }
        });
        const system = createGeneratorsSystem(config, consola);
        
        const actual = await system.isInitialized();

        expect(fileSystem.readFile).not.toHaveBeenCalled()
        expect(fileSystem.writeFile).not.toHaveBeenCalled()
        expect(fileSystem.readdir).not.toHaveBeenCalled()
        expect(fileSystem.ensureDir).not.toHaveBeenCalled()
        expect(fileSystem.stat).toHaveBeenCalledTimes(2)
        expect(fileSystem.stat).toHaveBeenNthCalledWith(1, path.resolve(path.join(config.cwd, '.pcgen.json')))
        expect(fileSystem.stat).toHaveBeenNthCalledWith(2, path.resolve(path.join(config.cwd, '.pcgen')))
        return expect(actual).toBeTruthy();
      });
    });

    describe('when called in a file system with empty .pcgenrc config file', () => {
      it('should return true', async () => {
        const config = createGeneratorSystemConfig({
          cwd: '/cwd',
          basePath: '/base',
        });
        const fileSystem = mockFileSystem(fs, {
          stat: {
            [path.resolve(path.join(config.cwd, '.pcgenrc'))]: 'file',
          }
        });
        const system = createGeneratorsSystem(config, consola);
        
        const actual = await system.isInitialized();

        expect(fileSystem.readFile).not.toHaveBeenCalled()
        expect(fileSystem.writeFile).not.toHaveBeenCalled()
        expect(fileSystem.readdir).not.toHaveBeenCalled()
        expect(fileSystem.ensureDir).not.toHaveBeenCalled()
        expect(fileSystem.stat).toHaveBeenCalledTimes(3)
        expect(fileSystem.stat).toHaveBeenNthCalledWith(1, path.resolve(path.join(config.cwd, '.pcgen.json')))
        expect(fileSystem.stat).toHaveBeenNthCalledWith(2, path.resolve(path.join(config.cwd, '.pcgen')))
        expect(fileSystem.stat).toHaveBeenNthCalledWith(3, path.resolve(path.join(config.cwd, '.pcgenrc')))
        return expect(actual).toBeTruthy();
      });
    });
  });

  describe('initialize', () => {
    it('should be a function', () => {
      const config = createGeneratorSystemConfig();
      const system = createGeneratorsSystem(config, consola);
      return expect(typeof system.initialize).toBe('function');
    });

    describe('when called in a fresh file system without options', () => {
      it('should return false', async () => {
        const config = createGeneratorSystemConfig({
          cwd: '/cwd',
          basePath: '/base',
          initAssets: '/ast',
          generatorFolder: 'gen',
          commandsFolder: 'cmd',
          templatesFolder: 'tpl',
          defaultCommand: 'create',
          pcgenFolder: '_pcg',
        });
        const fileSystem = mockFileSystem(fs);
        const system = createGeneratorsSystem(config, consola);
        // expect(system.configHelpers).toEqual({})
        // expect(system.configHelpers.atCwdFullPath('here')).toEqual(path.resolve(joinPaths(config.cwd, 'here')))
        // expect(system.configHelpers.atPcgenFullPath(system.configHelpers.generatorFolder)).toEqual(path.resolve(joinPaths(config.basePath, config.pcgenFolder, config.generatorFolder)))
        
        await system.initialize({});

        expect(fileSystem.stat).toHaveBeenCalledTimes(3)
        expect(fileSystem.stat).toHaveBeenNthCalledWith(1, path.resolve(joinPaths(config.cwd, '.pcgen.json')))
        expect(fileSystem.stat).toHaveBeenNthCalledWith(2, path.resolve(joinPaths(config.cwd, '.pcgen')))
        expect(fileSystem.stat).toHaveBeenNthCalledWith(3, path.resolve(joinPaths(config.cwd, '.pcgenrc')))
        
        expect(fileSystem.copy).toHaveBeenCalledTimes(2)
        expect(fileSystem.copy).toHaveBeenNthCalledWith(1, 
          system.configHelpers.atCwdFullPath(config.initAssets, config.generatorFolder),
          system.configHelpers.atPcgenFullPath(config.generatorFolder))

        expect(fileSystem.readFile).not.toHaveBeenCalled()
        expect(fileSystem.writeFile).toHaveBeenCalledTimes(2)
        expect(fileSystem.writeFile.mock.calls[0][0]).toBe(path.resolve(joinPaths(config.cwd, '.pcgen.json')))
        // expect(fileSystem.writeFile).toHaveBeenNthCalledWith(1, path.resolve(joinPaths(config.cwd, '.pcgen.json')))
        expect(fileSystem.readdir).not.toHaveBeenCalled()
        expect(fileSystem.ensureDir).not.toHaveBeenCalled()
      });
    });
  });
});
*/