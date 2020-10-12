import consola from 'consola';
import fs from 'fs-extra';
import {
  createFallbackModelLoader,
  createModelLoaders,
} from '../model-loaders';
import { IFileLocator, IOperationContext } from '../types';
import {
  createCodedError,
  haveRegex,
  haveStr,
  mockReadFileFor,
  mockStatFor,
} from './test-utils';

jest.mock('fs-extra');
jest.mock('json5');
jest.mock('js-yaml');
jest.mock('xml2js');
jest.mock('toml');
jest.mock('ini');

const modelWithDefaultFunction = 'model-with-default-function.js';
const modelWithoutDefaultFunction = 'model-without-default-function.js';

jest.mock(
  'model-with-default-function.js',
  () => ({
    __esModule: true,
    default: jest.fn(),
  }),
  {
    virtual: true,
  }
);
jest.mock(
  'model-without-default-function.js',
  () => ({
    __esModule: true,
    myFunction: jest.fn(),
  }),
  {
    virtual: true,
  }
);

const fileLocator: IFileLocator = {
  atBasePath: jest.fn(),
  atOutDir: jest.fn(),
  atCWD: jest.fn(),
  outDir: 'output-dir',
};

const fallbackLoader = createFallbackModelLoader(fileLocator);

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
      const loaders = fallbackLoader;

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
        const loaders = fallbackLoader;

        const actual = await loaders.loadModelFromContent(
          'content',
          {} as any,
          { loaderName: 'my-loader', isOptional: true }
        );

        expect(actual).toBeUndefined();
      });
    });

    describe('When loadModelFromContent is called with non-optional model', () => {
      it('it should log an error and return undefined', async () => {
        const loaders = fallbackLoader;

        const actual = await loaders.loadModelFromContent(
          'content',
          {} as any,
          { loaderName: 'my-loader', isOptional: false }
        );

        expect(actual).toBeUndefined();
      });
    });

    describe('When loadModelFromPath is called with optional model', () => {
      it('it should log an error and return undefined', async () => {
        const loaders = fallbackLoader;

        const actual = await loaders.loadModelFromPath(
          'filePath.myext',
          {} as any,
          { loaderName: 'my-loader', isOptional: true }
        );

        expect(actual).toBeUndefined();
      });
    });

    describe('When loadModelFromPath is called with non-optional model', () => {
      it('it should log an error and return undefined', async () => {
        const loaders = fallbackLoader;

        const actual = await loaders.loadModelFromPath(
          'filePath.myext',
          {} as any,
          { loaderName: 'my-loader', isOptional: false }
        );

        expect(actual).toBeUndefined();
      });
    });

    describe('When loadModelFromPath is called without options', () => {
      it('it should log an error and return undefined', async () => {
        const loaders = fallbackLoader;

        const actual = await loaders.loadModelFromPath(
          'filePath.myext',
          {} as any
        );

        expect(actual).toBeUndefined();
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

  const createFullPlugin = (
    name: string,
    extensions: string[] | undefined,
    fromContent: boolean,
    fromPath: boolean
  ) => ({
    name,
    extensions,
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

  const createPlugin = (num: number, fromContent: boolean, fromPath: boolean) =>
    createFullPlugin(
      `plugin${num}`,
      [`.p${num}`, `.pp${num}`],
      fromContent,
      fromPath
    );

  it('it should be a function', () =>
    expect(createModelLoaders).toEqual(expect.any(Function)));

  describe('When not loading default plugins', () => {
    describe('When no plugins are available', () => {
      it('it should return a proper mode loader', () => {
        const loaders = createModelLoaders({}, fallbackLoader, false);

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
          const loaders = createModelLoaders({}, fallbackLoader, false);

          const context: IOperationContext = {} as any;

          const actual = await loaders.loadModelFromContent(
            'content',
            context,
            { loaderName: 'json', isOptional: false }
          );

          expect(actual).toBeUndefined();
        });
      });

      describe('When calling loadModelFromContent with optional model', () => {
        it('it should return undefined and log errors properly', async () => {
          const loaders = createModelLoaders({}, fallbackLoader, false);

          const context: IOperationContext = {} as any;

          const actual = await loaders.loadModelFromContent(
            'content',
            context,
            { loaderName: 'json', isOptional: true }
          );

          expect(actual).toBeUndefined();
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

        const loaders = createModelLoaders(plugins, fallbackLoader, false);

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

      describe('When calling loadModelFromContent for a plugin with fromContent', () => {
        it('with no replace variables, it should return the expected model', async () => {
          const plugins = {
            loaders: [
              createPlugin(1, true, false),
              createPlugin(2, false, true),
              createPlugin(3, false, false),
            ],
          };

          const varName = 'MY_VAR';
          const varValue = 'VAR_VALUE';
          const content = `Model content with %${varName}%.`;

          const loaders = createModelLoaders(plugins, fallbackLoader, false);

          const context: IOperationContext = {
            vars: {
              [varName]: varValue,
            },
          } as any;

          const actual = await loaders.loadModelFromContent(content, context, {
            loaderName: 'plugin1',
            isOptional: false,
            replaceVariables: false,
          });

          expect(actual).toEqual({ content });
          expect(plugins.loaders[0].fromContent).toHaveBeenCalledTimes(1);
          expect(plugins.loaders[0].fromContent).toHaveBeenCalledWith(
            content,
            context
          );
        });

        it('with replace variables, it should return the expected model', async () => {
          const plugins = {
            loaders: [
              createPlugin(1, true, false),
              createPlugin(2, false, true),
              createPlugin(3, false, false),
            ],
          };

          const varName = 'MY_VAR';
          const varValue = 'VAR_VALUE';
          const content = `Model content with %${varName}%.`;

          const loaders = createModelLoaders(plugins, fallbackLoader, false);

          const context: IOperationContext = {
            vars: {
              [varName]: varValue,
            },
          } as any;

          const actual = await loaders.loadModelFromContent(content, context, {
            loaderName: 'plugin1',
            isOptional: false,
            replaceVariables: true,
          });

          const expectedContent = content.replace(`%${varName}%`, varValue);
          expect(actual).toEqual({ content: expectedContent });
          expect(plugins.loaders[0].fromContent).toHaveBeenCalledTimes(1);
          expect(plugins.loaders[0].fromContent).toHaveBeenCalledWith(
            expectedContent,
            context
          );
        });

        it('with missing replace variables, it should return the expected model', async () => {
          const plugins = {
            loaders: [
              createPlugin(1, true, false),
              createPlugin(2, false, true),
              createPlugin(3, false, false),
            ],
          };

          const varName = 'MY_VAR';
          const content = `Model content with %${varName}%.`;

          const loaders = createModelLoaders(plugins, fallbackLoader, false);

          const context: IOperationContext = {
            vars: {},
          } as any;

          const actual = await loaders.loadModelFromContent(content, context, {
            loaderName: 'plugin1',
            isOptional: false,
            replaceVariables: true,
          });

          const expectedContent = content;
          expect(actual).toEqual({ content: expectedContent });
          expect(plugins.loaders[0].fromContent).toHaveBeenCalledTimes(1);
          expect(plugins.loaders[0].fromContent).toHaveBeenCalledWith(
            expectedContent,
            context
          );
        });
      });

      describe('When calling loadModelFromContent for a plugin with no fromContent', () => {
        it('it should return the expected model', async () => {
          const plugins = {
            loaders: [
              createPlugin(1, true, false),
              createPlugin(2, false, true),
              createPlugin(3, false, false),
            ],
          };

          const content = `Model content`;

          const loaders = createModelLoaders(plugins, fallbackLoader, false);

          const context: IOperationContext = {} as any;

          const actual = await loaders.loadModelFromContent(content, context, {
            loaderName: 'plugin2',
            isOptional: false,
            replaceVariables: false,
          });

          expect(actual).toBeUndefined();
          expect(plugins.loaders[1].fromPath).not.toHaveBeenCalled();
        });
      });

      describe('When calling loadModelFromContent for a plugin which throws error', () => {
        it('it should return the expected model', async () => {
          const plugins = {
            loaders: [
              createPlugin(1, true, false),
              createPlugin(2, false, true),
              createPlugin(3, false, false),
            ],
          };

          const error = createCodedError('Plugin error', 'UNKNOWN');

          plugins.loaders[0].fromContent?.mockRejectedValue(error);

          const content = `Model content`;

          const loaders = createModelLoaders(plugins, fallbackLoader, false);

          const context: IOperationContext = {} as any;

          const actual = await loaders.loadModelFromContent(content, context, {
            loaderName: 'plugin1',
            isOptional: false,
            replaceVariables: false,
          });

          expect(actual).toBeUndefined();
          expect(plugins.loaders[0].fromContent).toHaveBeenCalledTimes(1);
        });
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

          const fileName = 'my-model.mdl';

          const statMock = mockStatFor(fs.stat, fileName, 'file');

          const loaders = createModelLoaders(plugins, fallbackLoader, false);

          const context: IOperationContext = {} as any;

          const actual = await loaders.loadModelFromPath(fileName, context, {
            loaderName: 'plugin2',
            isOptional: false,
            replaceVariables: false,
          });

          expect(statMock).toHaveBeenCalledWith(fileName);
          expect(actual).toEqual({ filePath: fileName });
          expect(plugins.loaders[1].fromPath).toHaveBeenCalledTimes(1);
          expect(plugins.loaders[1].fromPath).toHaveBeenCalledWith(
            fileName,
            context
          );
        });

        it('with extension name, it should return the expected model', async () => {
          const plugins = {
            loaders: [
              createPlugin(1, true, false),
              createPlugin(2, false, true),
              createPlugin(3, false, false),
            ],
          };

          const fileName = 'my-model.p2';

          const statMock = mockStatFor(fs.stat, fileName, 'file');

          const loaders = createModelLoaders(plugins, fallbackLoader, false);

          const context: IOperationContext = {} as any;

          const actual = await loaders.loadModelFromPath(fileName, context, {
            isOptional: false,
            replaceVariables: false,
          });

          expect(statMock).toHaveBeenCalledWith(fileName);
          expect(actual).toEqual({ filePath: fileName });
          expect(plugins.loaders[1].fromPath).toHaveBeenCalledTimes(1);
          expect(plugins.loaders[1].fromPath).toHaveBeenCalledWith(
            fileName,
            context
          );
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

          const fileName = 'my-model.mdl';

          const statMock = mockStatFor(fs.stat, 'my-other-model.mdl', 'file');

          const loaders = createModelLoaders(plugins, fallbackLoader, false);

          const context: IOperationContext = {} as any;

          const actual = await loaders.loadModelFromPath(fileName, context, {
            loaderName: 'plugin2',
            isOptional: false,
            replaceVariables: false,
          });

          expect(statMock).toHaveBeenCalledWith(fileName);
          expect(actual).toBeUndefined();
          expect(plugins.loaders[1].fromPath).not.toHaveBeenCalled();
        });

        it('with optional model, it should return the expected model', async () => {
          const plugins = {
            loaders: [
              createPlugin(1, true, false),
              createPlugin(2, false, true),
              createPlugin(3, false, false),
            ],
          };

          const fileName = 'my-model.mdl';

          const statMock = mockStatFor(fs.stat, 'my-other-model.mdl', 'file');

          const loaders = createModelLoaders(plugins, fallbackLoader, false);

          const context: IOperationContext = {} as any;

          const actual = await loaders.loadModelFromPath(fileName, context, {
            loaderName: 'plugin2',
            isOptional: true,
            replaceVariables: false,
          });

          expect(statMock).toHaveBeenCalledWith(fileName);
          expect(actual).toBeUndefined();
          expect(plugins.loaders[1].fromPath).not.toHaveBeenCalled();
        });
      });

      describe('When calling loadModelFromPath for a plugin name that does not exists, and no options', () => {
        it('it should return undefined and log the error', async () => {
          const plugins = {
            loaders: [
              createPlugin(1, true, false),
              createPlugin(2, false, true),
              createPlugin(3, false, false),
            ],
          };

          const fileName = 'my-model.mdl';

          const statMock = mockStatFor(fs.stat, fileName, 'file');

          const loaders = createModelLoaders(plugins, fallbackLoader, false);

          const context: IOperationContext = {} as any;

          const actual = await loaders.loadModelFromPath(fileName, context);

          expect(statMock).not.toHaveBeenCalled();
          expect(actual).toBeUndefined();
          for (const plugin of plugins.loaders) {
            if (plugin.fromContent) {
              expect(plugin.fromContent).not.toHaveBeenCalled();
            }
            if (plugin.fromPath) {
              expect(plugin.fromPath).not.toHaveBeenCalled();
            }
          }
        });
      });

      describe('When calling loadModelFromPath for a plugin with no fromPath and fromContent and when the model exists', () => {
        it('without replace variables, it should use fromContent to read model', async () => {
          const plugins = {
            loaders: [
              createPlugin(1, true, false),
              createPlugin(2, false, true),
              createPlugin(3, false, false),
            ],
          };

          const fileName = 'my-model.p1';
          const varName = 'MY_VAR';
          const varValue = 'VAR_VALUE';
          const modelContent = `Model content with %${varName}%.`;
          const expectedContent = modelContent;

          const statMock = mockStatFor(fs.stat, fileName, 'file');
          const readFileMock = mockReadFileFor(
            fs.readFile,
            fileName,
            modelContent
          );

          const loaders = createModelLoaders(plugins, fallbackLoader, false);

          const context: IOperationContext = {
            vars: { [varName]: varValue },
          } as any;

          const actual = await loaders.loadModelFromPath(fileName, context, {
            isOptional: false,
            replaceVariables: false,
          });

          expect(statMock).toHaveBeenCalledWith(fileName);
          expect(readFileMock).toHaveBeenCalledWith(fileName, 'utf-8');
          expect(actual).toEqual({ content: expectedContent });
          expect(plugins.loaders[0].fromContent).toHaveBeenCalledTimes(1);
          expect(plugins.loaders[0].fromContent).toHaveBeenCalledWith(
            expectedContent,
            context
          );
        });

        it('with replace variables, it should use fromContent to read model', async () => {
          const plugins = {
            loaders: [
              createPlugin(1, true, false),
              createPlugin(2, false, true),
              createPlugin(3, false, false),
            ],
          };

          const fileName = 'my-model.p1';
          const varName = 'MY_VAR';
          const varValue = 'VAR_VALUE';
          const modelContent = `Model content with %${varName}%.`;
          const expectedContent = `Model content with ${varValue}.`;

          const statMock = mockStatFor(fs.stat, fileName, 'file');
          const readFileMock = mockReadFileFor(
            fs.readFile,
            fileName,
            modelContent
          );

          const loaders = createModelLoaders(plugins, fallbackLoader, false);

          const context: IOperationContext = {
            vars: { [varName]: varValue },
          } as any;

          const actual = await loaders.loadModelFromPath(fileName, context, {
            isOptional: false,
            replaceVariables: true,
          });

          expect(statMock).toHaveBeenCalledWith(fileName);
          expect(readFileMock).toHaveBeenCalledWith(fileName, 'utf-8');
          expect(actual).toEqual({ content: expectedContent });
          expect(plugins.loaders[0].fromContent).toHaveBeenCalledTimes(1);
          expect(plugins.loaders[0].fromContent).toHaveBeenCalledWith(
            expectedContent,
            context
          );
        });
      });

      describe('When calling loadModelFromPath for a plugin with no fromPath and fromContent and when the model does not exists', () => {
        it('it should return undefined and log the error', async () => {
          const plugins = {
            loaders: [
              createPlugin(1, true, false),
              createPlugin(2, false, true),
              createPlugin(3, false, false),
            ],
          };

          const fileName = 'my-model.p1';

          const statMock = mockStatFor(fs.stat, fileName, 'file');
          const readFileMock = mockReadFileFor(
            fs.readFile,
            'other-file.mdl',
            'some content'
          );

          const loaders = createModelLoaders(plugins, fallbackLoader, false);

          const context: IOperationContext = {} as any;

          const actual = await loaders.loadModelFromPath(fileName, context, {
            isOptional: false,
            replaceVariables: false,
          });

          expect(statMock).toHaveBeenCalledWith(fileName);
          expect(readFileMock).toHaveBeenCalledWith(fileName, 'utf-8');
          expect(actual).toBeUndefined();
        });
      });

      describe('When calling loadModelFromPath for a plugin with no read option', () => {
        it('it should return undefined and log the error', async () => {
          const plugins = {
            loaders: [
              createPlugin(1, true, false),
              createPlugin(2, false, true),
              createPlugin(3, false, false),
            ],
          };

          const fileName = 'my-model.p3';

          const statMock = mockStatFor(fs.stat, fileName, 'file');
          const readFileMock = mockReadFileFor(
            fs.readFile,
            fileName,
            'some content'
          );

          const loaders = createModelLoaders(plugins, fallbackLoader, false);

          const context: IOperationContext = {} as any;

          const actual = await loaders.loadModelFromPath(fileName, context, {
            isOptional: false,
            replaceVariables: false,
          });

          expect(statMock).toHaveBeenCalledWith(fileName);
          expect(readFileMock).not.toHaveBeenCalled();
          expect(actual).toBeUndefined();
        });
      });

      describe('When calling loadModelFromPath for a plugin with fromPath which throws error', () => {
        it('it should return undefined and log the error', async () => {
          const plugins = {
            loaders: [
              createPlugin(1, true, false),
              createPlugin(2, false, true),
              createPlugin(3, false, false),
            ],
          };

          const fileName = 'my-model.p1';

          const error = createCodedError('Invalid file access', 'ENOACCESS');
          const statMock = mockStatFor(fs.stat, fileName, 'file');
          const readFileMock = mockReadFileFor(fs.readFile, fileName, () => {
            throw error;
          });

          const loaders = createModelLoaders(plugins, fallbackLoader, false);

          const context: IOperationContext = {} as any;

          const actual = await loaders.loadModelFromPath(fileName, context, {
            isOptional: false,
            replaceVariables: false,
          });

          expect(statMock).toHaveBeenCalledWith(fileName);
          expect(readFileMock).toHaveBeenCalledWith(fileName, 'utf-8');
          expect(actual).toBeUndefined();
          expect(plugins.loaders[1].fromPath).not.toHaveBeenCalled();
          expect(consola.error).toHaveBeenCalledTimes(1);
          expect(consola.error).toHaveBeenCalledWith(
            haveStr('Error loading model of type')
          );
          expect(consola.error).toHaveBeenCalledWith(haveStr('plugin1'));
        });
      });
    });
  });

  describe('When loading default plugins', () => {
    it('it should create a propper model loader', () => {
      const loaders = createModelLoaders({}, fallbackLoader, true);

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

      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(/Default model loader '.*module.*' for extensions: .*.js.*/)
      );
      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(
          /Default model loader '.*json.*' for extensions: .*.json.*, .*.json5.*/
        )
      );
      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(
          /Default model loader '.*yaml.*' for extensions: .*.yaml.*, .*.yml.*/
        )
      );
      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(/Default model loader '.*xml.*' for extensions: .*.xml.*/)
      );
      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(/Default model loader '.*toml.*' for extensions: .*.toml.*/)
      );
      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(/Default model loader '.*ini.*' for extensions: .*.ini.*/)
      );
      expect(consola.trace).toHaveBeenCalledWith(
        haveRegex(/Default model loader '.*ini.*' for extensions: .*.ini.*/)
      );
      expect(consola.trace).not.toHaveBeenCalledWith(
        haveRegex(/There are multiple plugin types with .*/)
      );
      expect(consola.warn).not.toHaveBeenCalledWith(
        haveRegex(/There are multiple plugin types with .*/)
      );
    });

    describe("When loading a model from a 'module' using loadModelFromPath", () => {
      it("when module have a default function returning a model, it should import the module's default function", async () => {
        const loaders = createModelLoaders({}, fallbackLoader, true);
        const modelModule = await import(modelWithDefaultFunction);
        const modelDefault: jest.Mock = modelModule.default;
        modelDefault.mockClear();

        mockStatFor(fs.stat, modelWithDefaultFunction, 'file');

        const expectedModel = { my: 'model' };
        modelDefault.mockReturnValue(expectedModel);

        const context = {} as IOperationContext;

        const model = await loaders.loadModelFromPath(
          modelWithDefaultFunction,
          context,
          { loaderName: 'module' }
        );

        expect(model).toBe(expectedModel);
        expect(modelDefault).toHaveBeenCalledTimes(1);
        expect(modelDefault).toHaveBeenCalledWith(context);
      });

      it("when module have a default function returning a Promise, it should import the module's default function", async () => {
        const loaders = createModelLoaders({}, fallbackLoader, true);
        const modelModule = await import(modelWithDefaultFunction);
        const modelDefault: jest.Mock = modelModule.default;
        modelDefault.mockClear();

        mockStatFor(fs.stat, modelWithDefaultFunction, 'file');

        const expectedModel = { my: 'model' };
        modelDefault.mockResolvedValue(expectedModel);

        const context = {} as IOperationContext;

        const model = await loaders.loadModelFromPath(
          modelWithDefaultFunction,
          context,
          { loaderName: 'module' }
        );

        expect(model).toBe(expectedModel);
        expect(modelDefault).toHaveBeenCalledTimes(1);
        expect(modelDefault).toHaveBeenCalledWith(context);
      });

      it('when module do not have a default function, it should fail importing the module', async () => {
        const loaders = createModelLoaders({}, fallbackLoader, true);

        mockStatFor(fs.stat, modelWithoutDefaultFunction, 'file');

        const context = {} as IOperationContext;

        const model = await loaders.loadModelFromPath(
          modelWithoutDefaultFunction,
          context,
          { loaderName: 'module' }
        );

        expect(model).toBeUndefined();
        expect(consola.trace).toHaveBeenCalledWith(
          haveRegex(/Module at .*'.+'.* does not exports a default function/g)
        );
      });
    });

    describe("When loading a model from a '.js' using loadModelFromPath", () => {
      it("when module have a default function returning a model, it should import the module's default function", async () => {
        const loaders = createModelLoaders({}, fallbackLoader, true);
        const modelModule = await import(modelWithDefaultFunction);
        const modelDefault: jest.Mock = modelModule.default;
        modelDefault.mockClear();

        mockStatFor(fs.stat, modelWithDefaultFunction, 'file');

        const expectedModel = { my: 'model' };
        modelDefault.mockReturnValue(expectedModel);

        const context = {} as IOperationContext;

        const model = await loaders.loadModelFromPath(
          modelWithDefaultFunction,
          context
        );

        expect(model).toBe(expectedModel);
        expect(modelDefault).toHaveBeenCalledTimes(1);
        expect(modelDefault).toHaveBeenCalledWith(context);
      });
    });

    describe("When loading a model from a 'json' file using loadModelFromPath", () => {
      it('when file have a model, it should import the file content parsing it using json5', async () => {
        const loaders = createModelLoaders({}, fallbackLoader, true);
        const json5Module = await import('json5');
        const json5Parse: jest.Mock = json5Module.parse as any;
        json5Parse.mockClear();

        const fileName = 'my-model.json';
        const fileContent = 'File Content!';
        const expectedModel = { my: 'model' };
        mockStatFor(fs.stat, fileName, 'file');
        mockReadFileFor(fs.readFile, fileName, fileContent);

        json5Parse.mockReturnValue(expectedModel);

        const context = {} as IOperationContext;

        const model = await loaders.loadModelFromPath(fileName, context, {
          loaderName: 'json',
        });

        expect(model).toBe(expectedModel);
        expect(json5Parse).toHaveBeenCalledTimes(1);
        expect(json5Parse).toHaveBeenCalledWith(fileContent);
      });
    });

    describe("When loading a model from a '.json' file using loadModelFromPath", () => {
      it('when file have a model, it should import the file content parsing it using json5', async () => {
        const loaders = createModelLoaders({}, fallbackLoader, true);
        const json5Module = await import('json5');
        const json5Parse: jest.Mock = json5Module.parse as any;
        json5Parse.mockClear();

        const fileName = 'my-model.json';
        const fileContent = 'File Content!';
        const expectedModel = { my: 'model' };
        mockStatFor(fs.stat, fileName, 'file');
        mockReadFileFor(fs.readFile, fileName, fileContent);

        json5Parse.mockReturnValue(expectedModel);

        const context = {} as IOperationContext;

        const model = await loaders.loadModelFromPath(fileName, context);

        expect(model).toBe(expectedModel);
        expect(json5Parse).toHaveBeenCalledTimes(1);
        expect(json5Parse).toHaveBeenCalledWith(fileContent);
      });
    });

    describe("When loading a model from a '.json5' file using loadModelFromPath", () => {
      it('when file have a model, it should import the file content parsing it using json5', async () => {
        const loaders = createModelLoaders({}, fallbackLoader, true);
        const json5Module = await import('json5');
        const json5Parse: jest.Mock = json5Module.parse as any;
        json5Parse.mockClear();

        const fileName = 'my-model.json5';
        const fileContent = 'File Content!';
        const expectedModel = { my: 'model' };
        mockStatFor(fs.stat, fileName, 'file');
        mockReadFileFor(fs.readFile, fileName, fileContent);

        json5Parse.mockReturnValue(expectedModel);

        const context = {} as IOperationContext;

        const model = await loaders.loadModelFromPath(fileName, context);

        expect(model).toBe(expectedModel);
        expect(json5Parse).toHaveBeenCalledTimes(1);
        expect(json5Parse).toHaveBeenCalledWith(fileContent);
      });
    });

    describe("When loading a model from a 'json' content using loadModelFromContent", () => {
      it('when file have a model, it should import the file content parsing it using json5', async () => {
        const loaders = createModelLoaders({}, fallbackLoader, true);
        const json5Module = await import('json5');
        const json5Parse: jest.Mock = json5Module.parse as any;
        json5Parse.mockClear();

        const fileContent = 'File Content!';
        const expectedModel = { my: 'model' };

        json5Parse.mockReturnValue(expectedModel);

        const context = {} as IOperationContext;

        const model = await loaders.loadModelFromContent(fileContent, context, {
          loaderName: 'json',
        });

        expect(model).toBe(expectedModel);
        expect(json5Parse).toHaveBeenCalledTimes(1);
        expect(json5Parse).toHaveBeenCalledWith(fileContent);
      });
    });

    describe("When loading a model from a 'yaml' file using loadModelFromPath", () => {
      it('when file have a model, it should import the file content parsing it using js-yaml', async () => {
        const loaders = createModelLoaders({}, fallbackLoader, true);
        const yamlModule = await import('js-yaml');
        const yamlLoad: jest.Mock = yamlModule.safeLoad as any;
        yamlLoad.mockClear();

        const fileName = 'my-model.yaml';
        const fileContent = 'File Content!';
        const expectedModel = { my: 'model' };
        mockStatFor(fs.stat, fileName, 'file');
        mockReadFileFor(fs.readFile, fileName, fileContent);

        yamlLoad.mockReturnValue(expectedModel);

        const context = {} as IOperationContext;

        const model = await loaders.loadModelFromPath(fileName, context, {
          loaderName: 'yaml',
        });

        expect(model).toBe(expectedModel);
        expect(yamlLoad).toHaveBeenCalledTimes(1);
        expect(yamlLoad).toHaveBeenCalledWith(fileContent);
      });
    });

    describe("When loading a model from a '.yaml' file using loadModelFromPath", () => {
      it('when file have a model, it should import the file content parsing it using js-yaml', async () => {
        const loaders = createModelLoaders({}, fallbackLoader, true);
        const yamlModule = await import('js-yaml');
        const yamlLoad: jest.Mock = yamlModule.safeLoad as any;
        yamlLoad.mockClear();

        const fileName = 'my-model.yaml';
        const fileContent = 'File Content!';
        const expectedModel = { my: 'model' };
        mockStatFor(fs.stat, fileName, 'file');
        mockReadFileFor(fs.readFile, fileName, fileContent);

        yamlLoad.mockReturnValue(expectedModel);

        const context = {} as IOperationContext;

        const model = await loaders.loadModelFromPath(fileName, context);

        expect(model).toBe(expectedModel);
        expect(yamlLoad).toHaveBeenCalledTimes(1);
        expect(yamlLoad).toHaveBeenCalledWith(fileContent);
      });
    });

    describe("When loading a model from a '.yml' file using loadModelFromPath", () => {
      it('when file have a model, it should import the file content parsing it using js-yaml', async () => {
        const loaders = createModelLoaders({}, fallbackLoader, true);
        const yamlModule = await import('js-yaml');
        const yamlLoad: jest.Mock = yamlModule.safeLoad as any;
        yamlLoad.mockClear();

        const fileName = 'my-model.yml';
        const fileContent = 'File Content!';
        const expectedModel = { my: 'model' };
        mockStatFor(fs.stat, fileName, 'file');
        mockReadFileFor(fs.readFile, fileName, fileContent);

        yamlLoad.mockReturnValue(expectedModel);

        const context = {} as IOperationContext;

        const model = await loaders.loadModelFromPath(fileName, context);

        expect(model).toBe(expectedModel);
        expect(yamlLoad).toHaveBeenCalledTimes(1);
        expect(yamlLoad).toHaveBeenCalledWith(fileContent);
      });
    });

    describe("When loading a model from a 'yaml' content using loadModelFromContent", () => {
      it('when file have a model, it should import the file content parsing it using js-yaml', async () => {
        const loaders = createModelLoaders({}, fallbackLoader, true);
        const yamlModule = await import('js-yaml');
        const yamlLoad: jest.Mock = yamlModule.safeLoad as any;
        yamlLoad.mockClear();

        const fileContent = 'File Content!';
        const expectedModel = { my: 'model' };

        yamlLoad.mockReturnValue(expectedModel);

        const context = {} as IOperationContext;

        const model = await loaders.loadModelFromContent(fileContent, context, {
          loaderName: 'yaml',
        });

        expect(model).toBe(expectedModel);
        expect(yamlLoad).toHaveBeenCalledTimes(1);
        expect(yamlLoad).toHaveBeenCalledWith(fileContent);
      });
    });

    describe("When loading a model from a 'xml' file using loadModelFromPath", () => {
      it('when file have a model, it should import the file content parsing it using xml2js', async () => {
        const loaders = createModelLoaders({}, fallbackLoader, true);
        const xmlModule = await import('xml2js');
        const xmlParse: jest.Mock = xmlModule.parseStringPromise as any;
        xmlParse.mockClear();

        const fileName = 'my-model.xml';
        const fileContent = 'File Content!';
        const expectedModel = { my: 'model' };
        mockStatFor(fs.stat, fileName, 'file');
        mockReadFileFor(fs.readFile, fileName, fileContent);

        xmlParse.mockResolvedValue(expectedModel);

        const context = {} as IOperationContext;

        const model = await loaders.loadModelFromPath(fileName, context, {
          loaderName: 'xml',
        });

        expect(model).toBe(expectedModel);
        expect(xmlParse).toHaveBeenCalledTimes(1);
        expect(xmlParse).toHaveBeenCalledWith(fileContent);
      });
    });

    describe("When loading a model from a '.xml' file using loadModelFromPath", () => {
      it('when file have a model, it should import the file content parsing it using xml2js', async () => {
        const loaders = createModelLoaders({}, fallbackLoader, true);
        const xmlModule = await import('xml2js');
        const xmlParse: jest.Mock = xmlModule.parseStringPromise as any;
        xmlParse.mockClear();

        const fileName = 'my-model.xml';
        const fileContent = 'File Content!';
        const expectedModel = { my: 'model' };
        mockStatFor(fs.stat, fileName, 'file');
        mockReadFileFor(fs.readFile, fileName, fileContent);

        xmlParse.mockResolvedValue(expectedModel);

        const context = {} as IOperationContext;

        const model = await loaders.loadModelFromPath(fileName, context);

        expect(model).toBe(expectedModel);
        expect(xmlParse).toHaveBeenCalledTimes(1);
        expect(xmlParse).toHaveBeenCalledWith(fileContent);
      });
    });

    describe("When loading a model from a 'xml' content using loadModelFromContent", () => {
      it('when file have a model, it should import the file content parsing it using xml2js', async () => {
        const loaders = createModelLoaders({}, fallbackLoader, true);
        const xmlModule = await import('xml2js');
        const xmlParse: jest.Mock = xmlModule.parseStringPromise as any;
        xmlParse.mockClear();

        const fileContent = 'File Content!';
        const expectedModel = { my: 'model' };

        xmlParse.mockResolvedValue(expectedModel);

        const context = {} as IOperationContext;

        const model = await loaders.loadModelFromContent(fileContent, context, {
          loaderName: 'xml',
        });

        expect(model).toBe(expectedModel);
        expect(xmlParse).toHaveBeenCalledTimes(1);
        expect(xmlParse).toHaveBeenCalledWith(fileContent);
      });
    });

    describe("When loading a model from a 'toml' file using loadModelFromPath", () => {
      it('when file have a model, it should import the file content parsing it using toml', async () => {
        const loaders = createModelLoaders({}, fallbackLoader, true);
        const tomlModule = await import('toml');
        const tomlParse: jest.Mock = tomlModule.parse as any;
        tomlParse.mockClear();

        const fileName = 'my-model.toml';
        const fileContent = 'File Content!';
        const expectedModel = { my: 'model' };
        mockStatFor(fs.stat, fileName, 'file');
        mockReadFileFor(fs.readFile, fileName, fileContent);

        tomlParse.mockReturnValue(expectedModel);

        const context = {} as IOperationContext;

        const model = await loaders.loadModelFromPath(fileName, context, {
          loaderName: 'toml',
        });

        expect(model).toBe(expectedModel);
        expect(tomlParse).toHaveBeenCalledTimes(1);
        expect(tomlParse).toHaveBeenCalledWith(fileContent);
      });
    });

    describe("When loading a model from a '.toml' file using loadModelFromPath", () => {
      it('when file have a model, it should import the file content parsing it using toml', async () => {
        const loaders = createModelLoaders({}, fallbackLoader, true);
        const tomlModule = await import('toml');
        const tomlParse: jest.Mock = tomlModule.parse as any;
        tomlParse.mockClear();

        const fileName = 'my-model.toml';
        const fileContent = 'File Content!';
        const expectedModel = { my: 'model' };
        mockStatFor(fs.stat, fileName, 'file');
        mockReadFileFor(fs.readFile, fileName, fileContent);

        tomlParse.mockReturnValue(expectedModel);

        const context = {} as IOperationContext;

        const model = await loaders.loadModelFromPath(fileName, context);

        expect(model).toBe(expectedModel);
        expect(tomlParse).toHaveBeenCalledTimes(1);
        expect(tomlParse).toHaveBeenCalledWith(fileContent);
      });
    });

    describe("When loading a model from a 'toml' content using loadModelFromContent", () => {
      it('when file have a model, it should import the file content parsing it using toml', async () => {
        const loaders = createModelLoaders({}, fallbackLoader, true);
        const tomlModule = await import('toml');
        const tomlParse: jest.Mock = tomlModule.parse as any;
        tomlParse.mockClear();

        const fileContent = 'File Content!';
        const expectedModel = { my: 'model' };

        tomlParse.mockReturnValue(expectedModel);

        const context = {} as IOperationContext;

        const model = await loaders.loadModelFromContent(fileContent, context, {
          loaderName: 'toml',
        });

        expect(model).toBe(expectedModel);
        expect(tomlParse).toHaveBeenCalledTimes(1);
        expect(tomlParse).toHaveBeenCalledWith(fileContent);
      });
    });

    describe("When loading a model from a 'ini' file using loadModelFromPath", () => {
      it('when file have a model, it should import the file content parsing it using ini', async () => {
        const loaders = createModelLoaders({}, fallbackLoader, true);
        const iniModule = await import('ini');
        const iniParse: jest.Mock = iniModule.parse as any;
        iniParse.mockClear();

        const fileName = 'my-model.ini';
        const fileContent = 'File Content!';
        const expectedModel = { my: 'model' };
        mockStatFor(fs.stat, fileName, 'file');
        mockReadFileFor(fs.readFile, fileName, fileContent);

        iniParse.mockReturnValue(expectedModel);

        const context = {} as IOperationContext;

        const model = await loaders.loadModelFromPath(fileName, context, {
          loaderName: 'ini',
        });

        expect(model).toBe(expectedModel);
        expect(iniParse).toHaveBeenCalledTimes(1);
        expect(iniParse).toHaveBeenCalledWith(fileContent);
      });
    });

    describe("When loading a model from a '.ini' file using loadModelFromPath", () => {
      it('when file have a model, it should import the file content parsing it using ini', async () => {
        const loaders = createModelLoaders({}, fallbackLoader, true);
        const iniModule = await import('ini');
        const iniParse: jest.Mock = iniModule.parse as any;
        iniParse.mockClear();

        const fileName = 'my-model.ini';
        const fileContent = 'File Content!';
        const expectedModel = { my: 'model' };
        mockStatFor(fs.stat, fileName, 'file');
        mockReadFileFor(fs.readFile, fileName, fileContent);

        iniParse.mockReturnValue(expectedModel);

        const context = {} as IOperationContext;

        const model = await loaders.loadModelFromPath(fileName, context);

        expect(model).toBe(expectedModel);
        expect(iniParse).toHaveBeenCalledTimes(1);
        expect(iniParse).toHaveBeenCalledWith(fileContent);
      });
    });

    describe("When loading a model from a 'ini' content using loadModelFromContent", () => {
      it('when file have a model, it should import the file content parsing it using ini', async () => {
        const loaders = createModelLoaders({}, fallbackLoader, true);
        const iniModule = await import('ini');
        const iniParse: jest.Mock = iniModule.parse as any;
        iniParse.mockClear();

        const fileContent = 'File Content!';
        const expectedModel = { my: 'model' };

        iniParse.mockReturnValue(expectedModel);

        const context = {} as IOperationContext;

        const model = await loaders.loadModelFromContent(fileContent, context, {
          loaderName: 'ini',
        });

        expect(model).toBe(expectedModel);
        expect(iniParse).toHaveBeenCalledTimes(1);
        expect(iniParse).toHaveBeenCalledWith(fileContent);
      });
    });
  });
});
