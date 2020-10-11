import consola from 'consola';
import fs from 'fs-extra';
import {
  createFallbackModelLoader,
  createModelLoaders,
} from '../model-loaders';
import { IFileLocator, IOperationContext } from '../types';
import { mockStatFor } from './test-utils';

jest.mock('fs-extra');

const fileLocator: IFileLocator = {
  atBasePath: jest.fn(),
  atOutDir: jest.fn(),
  atCWD: jest.fn(),
  outDir: 'output-dir',
};

describe('createFallbackModelLoader', () => {
  beforeAll(() => {
    consola.wrapAll();
  });
  beforeEach(() => {
    consola.mockTypes(() => jest.fn());
  });

  it('should be a function', () =>
    expect(typeof createFallbackModelLoader).toBe('function'));

  describe('When given a file locator', () => {
    it('it should return a ModelLoader with file locator utilities', async () => {
      const loaders = createFallbackModelLoader(fileLocator);

      expect(loaders).toEqual(
        expect.objectContaining({
          atBasePath: fileLocator.atBasePath,
          atOutDir: fileLocator.atOutDir,
          atCWD: fileLocator.atCWD,
          outDir: fileLocator.outDir,
          loadModelFromContent: expect.any(Function),
          loadModelFromPath: expect.any(Function),
        })
      );
    });

    describe('When loadModelFromContent is called with optional model', () => {
      it('it should log an error and return undefined', async () => {
        const loaders = createFallbackModelLoader(fileLocator);

        const actual = await loaders.loadModelFromContent(
          'content',
          {} as any,
          { loaderName: 'my-loader', isOptional: true }
        );

        expect(actual).toBeUndefined();
        expect(consola.log).toHaveBeenCalledTimes(0);
        expect(consola.trace).toHaveBeenCalledTimes(1);
        expect(consola.trace).toHaveBeenCalledWith(
          expect.stringContaining('my-loader')
        );
      });
    });

    describe('When loadModelFromContent is called with non-optional model', () => {
      it('it should log an error and return undefined', async () => {
        const loaders = createFallbackModelLoader(fileLocator);

        const actual = await loaders.loadModelFromContent(
          'content',
          {} as any,
          { loaderName: 'my-loader', isOptional: false }
        );

        expect(actual).toBeUndefined();
        expect(consola.log).toHaveBeenCalledTimes(1);
        expect(consola.trace).toHaveBeenCalledTimes(0);
        expect(consola.log).toHaveBeenCalledWith(
          expect.stringContaining('my-loader')
        );
      });
    });

    describe('When loadModelFromPath is called with optional model', () => {
      it('it should log an error and return undefined', async () => {
        const loaders = createFallbackModelLoader(fileLocator);

        const actual = await loaders.loadModelFromPath(
          'filePath.myext',
          {} as any,
          { loaderName: 'my-loader', isOptional: true }
        );

        expect(actual).toBeUndefined();
        expect(consola.log).toHaveBeenCalledTimes(0);
        expect(consola.trace).toHaveBeenCalledTimes(1);
        expect(consola.trace).toHaveBeenCalledWith(
          expect.stringContaining('my-loader')
        );
        expect(consola.trace).toHaveBeenCalledWith(
          expect.stringContaining('.myext')
        );
      });
    });

    describe('When loadModelFromPath is called with non-optional model', () => {
      it('it should log an error and return undefined', async () => {
        const loaders = createFallbackModelLoader(fileLocator);

        const actual = await loaders.loadModelFromPath(
          'filePath.myext',
          {} as any,
          { loaderName: 'my-loader', isOptional: false }
        );

        expect(actual).toBeUndefined();
        expect(consola.log).toHaveBeenCalledTimes(1);
        expect(consola.trace).toHaveBeenCalledTimes(0);
        expect(consola.log).toHaveBeenCalledWith(
          expect.stringContaining('my-loader')
        );
        expect(consola.log).toHaveBeenCalledWith(
          expect.stringContaining('.myext')
        );
      });
    });

    describe('When loadModelFromPath is called without options', () => {
      it('it should log an error and return undefined', async () => {
        const loaders = createFallbackModelLoader(fileLocator);

        const actual = await loaders.loadModelFromPath(
          'filePath.myext',
          {} as any
        );

        expect(actual).toBeUndefined();
        expect(consola.log).toHaveBeenCalledTimes(1);
        expect(consola.trace).toHaveBeenCalledTimes(0);
        expect(consola.log).toHaveBeenCalledWith(
          expect.stringContaining('unspecified')
        );
        expect(consola.log).toHaveBeenCalledWith(
          expect.stringContaining('.myext')
        );
      });
    });
  });
});

describe('createModelLoaders', () => {
  beforeAll(() => {
    consola.wrapAll();
  });
  beforeEach(() => {
    consola.mockTypes(() => jest.fn());
  });

  const createPlugin = (
    num: number,
    fromContent: boolean,
    fromPath: boolean
  ) => ({
    name: 'plugin' + num,
    extensions: ['.p' + num, '.pp' + num],
    fromContent: fromContent
      ? jest
          .fn<Promise<any>, [string, any]>()
          .mockImplementation(async (content, _context) => {
            return {
              content,
            };
          })
      : undefined,
    fromPath: fromPath
      ? jest
          .fn<Promise<any>, [string, any]>()
          .mockImplementation(async (filePath, _context) => {
            return {
              filePath,
            };
          })
      : undefined,
  });

  it('it should be a function', () =>
    expect(createModelLoaders).toEqual(expect.any(Function)));

  describe('When not loading default plugins', () => {
    describe('When no plugins are available', () => {
      it('it should return a proper mode loader', () => {
        const loaders = createModelLoaders(
          {},
          createFallbackModelLoader(fileLocator),
          false
        );

        expect(loaders).toEqual(
          expect.objectContaining({
            atBasePath: fileLocator.atBasePath,
            atOutDir: fileLocator.atOutDir,
            atCWD: fileLocator.atCWD,
            outDir: fileLocator.outDir,
            loadModelFromContent: expect.any(Function),
            loadModelFromPath: expect.any(Function),
          })
        );
      });

      describe('When calling loadModelFromContent with non-optional model', () => {
        it('it should return undefined and log errors properly', async () => {
          const loaders = createModelLoaders(
            {},
            createFallbackModelLoader(fileLocator),
            false
          );

          const context: IOperationContext = {} as any;

          const actual = await loaders.loadModelFromContent(
            'content',
            context,
            { loaderName: 'json', isOptional: false }
          );

          expect(actual).toBeUndefined();
          expect(consola.log).toHaveBeenCalledTimes(1);
          expect(consola.log).toHaveBeenCalledWith(
            expect.stringContaining('json')
          );
        });
      });

      describe('When calling loadModelFromContent with optional model', () => {
        it('it should return undefined and log errors properly', async () => {
          const loaders = createModelLoaders(
            {},
            createFallbackModelLoader(fileLocator),
            false
          );

          const context: IOperationContext = {} as any;

          const actual = await loaders.loadModelFromContent(
            'content',
            context,
            { loaderName: 'json', isOptional: true }
          );

          expect(actual).toBeUndefined();
          expect(consola.trace).toHaveBeenCalledTimes(1);
          expect(consola.trace).toHaveBeenCalledWith(
            expect.stringContaining('json')
          );
        });
      });
    });

    describe('When plugins are available', () => {
      it('it should return a proper mode loader', () => {
        const plugins = {
          loaders: [
            createPlugin(1, true, false),
            createPlugin(2, false, true),
            createPlugin(3, false, false),
          ],
        };

        const loaders = createModelLoaders(
          plugins,
          createFallbackModelLoader(fileLocator),
          false
        );

        expect(loaders).toEqual(
          expect.objectContaining({
            atBasePath: fileLocator.atBasePath,
            atOutDir: fileLocator.atOutDir,
            atCWD: fileLocator.atCWD,
            outDir: fileLocator.outDir,
            loadModelFromContent: expect.any(Function),
            loadModelFromPath: expect.any(Function),
          })
        );
      });

      describe('When calling loadModelFromPath for a plugin with fromPath and when the model exists', () => {
        it('with loaderName, it should return the expected model', async () => {
          const plugins = {
            loaders: [
              createPlugin(1, true, false),
              createPlugin(2, false, true),
              createPlugin(3, false, false),
            ],
          };

          const fileName = 'my-model.mdl'

          const statMock = mockStatFor(fs.stat, fileName, 'file');

          const loaders = createModelLoaders(
            plugins,
            createFallbackModelLoader(fileLocator),
            false
          );

          const context: IOperationContext = {} as any;

          const actual = await loaders.loadModelFromPath(
            fileName,
            context,
            {
              loaderName: 'plugin2',
              isOptional: false,
              replaceVariables: false,
            }
          );

          expect(statMock).toHaveBeenCalledWith(fileName);
          expect(actual).toEqual({ filePath: fileName });
          expect(plugins.loaders[1].fromPath).toHaveBeenCalledTimes(1);
          expect(plugins.loaders[1].fromPath).toHaveBeenCalledWith(fileName, context);
        });

        it('with extension name, it should return the expected model', async () => {
          const plugins = {
            loaders: [
              createPlugin(1, true, false),
              createPlugin(2, false, true),
              createPlugin(3, false, false),
            ],
          };

          const fileName = 'my-model.p2'

          const statMock = mockStatFor(fs.stat, fileName, 'file');

          const loaders = createModelLoaders(
            plugins,
            createFallbackModelLoader(fileLocator),
            false
          );

          const context: IOperationContext = {} as any;

          const actual = await loaders.loadModelFromPath(
            fileName,
            context,
            {
              isOptional: false,
              replaceVariables: false,
            }
          );

          expect(statMock).toHaveBeenCalledWith(fileName);
          expect(actual).toEqual({ filePath: fileName });
          expect(plugins.loaders[1].fromPath).toHaveBeenCalledTimes(1);
          expect(plugins.loaders[1].fromPath).toHaveBeenCalledWith(fileName, context);
        });
      });

      describe('When calling loadModelFromPath for a plugin with fromPath and when the model does not exist', () => {
        it('it should return the expected model', async () => {
          const plugins = {
            loaders: [
              createPlugin(1, true, false),
              createPlugin(2, false, true),
              createPlugin(3, false, false),
            ],
          };

          const fileName = 'my-model.mdl'

          const statMock = mockStatFor(fs.stat, 'my-other-model.mdl', 'file');

          const loaders = createModelLoaders(
            plugins,
            createFallbackModelLoader(fileLocator),
            false
          );

          const context: IOperationContext = {} as any;

          const actual = await loaders.loadModelFromPath(
            fileName,
            context,
            {
              loaderName: 'plugin2',
              isOptional: false,
              replaceVariables: false,
            }
          );

          expect(statMock).toHaveBeenCalledWith(fileName);
          expect(actual).toBeUndefined();
          expect(plugins.loaders[1].fromPath).not.toHaveBeenCalled();
          expect(consola.log).toHaveBeenCalledTimes(1);
          expect(consola.log).toHaveBeenCalledWith(expect.stringContaining(fileName));
        });
        
        it('with optional model, it should return the expected model', async () => {
          const plugins = {
            loaders: [
              createPlugin(1, true, false),
              createPlugin(2, false, true),
              createPlugin(3, false, false),
            ],
          };

          const fileName = 'my-model.mdl'

          const statMock = mockStatFor(fs.stat, 'my-other-model.mdl', 'file');

          const loaders = createModelLoaders(
            plugins,
            createFallbackModelLoader(fileLocator),
            false
          );

          const context: IOperationContext = {} as any;

          const actual = await loaders.loadModelFromPath(
            fileName,
            context,
            {
              loaderName: 'plugin2',
              isOptional: true,
              replaceVariables: false,
            }
          );

          expect(statMock).toHaveBeenCalledWith(fileName);
          expect(actual).toBeUndefined();
          expect(plugins.loaders[1].fromPath).not.toHaveBeenCalled();
          expect(consola.trace).toHaveBeenCalledWith(expect.stringContaining(fileName));
        });
      });
    });
  });
});
