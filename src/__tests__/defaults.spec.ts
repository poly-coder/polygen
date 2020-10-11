import { LogLevel } from 'consola';
import {
  requiredInitOptions,
  requiredListOptions,
  requiredInfoOptions,
  requiredRunOptions,
} from '../defaults';

jest.mock('fs-extra');

describe('requiredInitOptions', () => {
  beforeEach(() => {});

  it('should be a function', () =>
    expect(typeof requiredInitOptions).toBe('function'));

  describe('When no options are given', () => {
    it('should return default options', async () => {
      expect(requiredInitOptions()).toEqual({
        commandsFolder: 'commands',
        configFile: 'pcgen.config.js',
        cwd: '.',
        defaultCommand: 'new',
        generatorFolder: 'generator',
        initAssets: 'assets',
        logLevel: 3,
        outDir: '.',
        pcgenFolder: '_pcgen',
        searchPaths: [],
        showOptions: false,
        templatesFolder: 'templates',
        version: '',
      });
    });
  });

  describe('When all options are given', () => {
    it('should return given options', async () => {
      expect(
        requiredInitOptions({
          logLevel: LogLevel.Warn,
          showOptions: true,
          version: '42',
          commandsFolder: 'cmds',
          configFile: 'pcgen.js',
          cwd: '/',
          defaultCommand: 'start',
          generatorFolder: 'gen',
          initAssets: 'ast',
          outDir: '..',
          pcgenFolder: '_pcg',
          searchPaths: ['here'],
          templatesFolder: 'tmp',
        })
      ).toEqual({
        commandsFolder: 'cmds',
        configFile: 'pcgen.js',
        cwd: '/',
        defaultCommand: 'start',
        generatorFolder: 'gen',
        initAssets: 'ast',
        logLevel: 1,
        outDir: '..',
        pcgenFolder: '_pcg',
        searchPaths: ['here'],
        showOptions: true,
        templatesFolder: 'tmp',
        version: '42',
      });
    });
  });

  describe('When some options are given', () => {
    it('should return merged options', async () => {
      expect(
        requiredInitOptions({
          logLevel: LogLevel.Warn,
          showOptions: true,
          version: '42',
          cwd: '/',
          generatorFolder: 'gen',
          outDir: '..',
          templatesFolder: 'tmp',
        })
      ).toEqual({
        commandsFolder: 'commands',
        configFile: 'pcgen.config.js',
        cwd: '/',
        defaultCommand: 'new',
        generatorFolder: 'gen',
        initAssets: 'assets',
        logLevel: 1,
        outDir: '..',
        pcgenFolder: '_pcgen',
        searchPaths: [],
        showOptions: true,
        templatesFolder: 'tmp',
        version: '42',
      });
    });
  });
});

describe('requiredListOptions', () => {
  beforeEach(() => {});

  it('should be a function', () =>
    expect(typeof requiredListOptions).toBe('function'));

  describe('When no options are given', () => {
    it('should return default options', async () => {
      expect(requiredListOptions()).toEqual({
        configFile: 'pcgen.config.js',
        generator: undefined,
        logLevel: 3,
        showBasePath: false,
        showCommands: false,
        showDetails: false,
        showOptions: false,
        showSummary: false,
        tag: [],
        version: '',
      });
    });
  });

  describe('When all options are given', () => {
    it('should return given options', async () => {
      expect(
        requiredListOptions({
          configFile: 'pcgen.js',
          generator: 'sample',
          logLevel: LogLevel.Trace,
          showBasePath: true,
          showCommands: true,
          showDetails: true,
          showOptions: true,
          showSummary: true,
          tag: ['builtin'],
          version: '42',
        })
      ).toEqual({
        configFile: 'pcgen.js',
        generator: 'sample',
        logLevel: LogLevel.Trace,
        showBasePath: true,
        showCommands: true,
        showDetails: true,
        showOptions: true,
        showSummary: true,
        tag: ['builtin'],
        version: '42',
      });
    });
  });

  describe('When some options are given', () => {
    it('should return merged options', async () => {
      expect(
        requiredListOptions({
          configFile: 'pcgen.js',
          logLevel: LogLevel.Trace,
          showOptions: true,
          showSummary: true,
          version: '42',
        })
      ).toEqual({
        configFile: 'pcgen.js',
        generator: undefined,
        logLevel: LogLevel.Trace,
        showBasePath: false,
        showCommands: false,
        showDetails: false,
        showOptions: true,
        showSummary: true,
        tag: [],
        version: '42',
      });
    });
  });
});

describe('requiredInfoOptions', () => {
  beforeEach(() => {});

  it('should be a function', () =>
    expect(typeof requiredInfoOptions).toBe('function'));

  describe('When no options are given', () => {
    it('should return default options', async () => {
      expect(requiredInfoOptions()).toEqual({
        configFile: 'pcgen.config.js',
        generator: undefined,
        logLevel: 3,
        showBasePath: true,
        showCommands: true,
        showDetails: true,
        showOptions: false,
        showSummary: true,
        tag: [],
        version: '',
      });
    });
  });

  describe('When all options are given', () => {
    it('should return given options', async () => {
      expect(
        requiredInfoOptions({
          configFile: 'pcgen.js',
          generator: 'sample',
          logLevel: LogLevel.Trace,
          showBasePath: false,
          showCommands: false,
          showDetails: false,
          showOptions: true,
          showSummary: false,
          tag: ['builtin'],
          version: '42',
        })
      ).toEqual({
        configFile: 'pcgen.js',
        generator: 'sample',
        logLevel: LogLevel.Trace,
        showBasePath: false,
        showCommands: false,
        showDetails: false,
        showOptions: true,
        showSummary: false,
        tag: ['builtin'],
        version: '42',
      });
    });
  });

  describe('When some options are given', () => {
    it('should return merged options', async () => {
      expect(
        requiredInfoOptions({
          configFile: 'pcgen.js',
          logLevel: LogLevel.Trace,
          showOptions: false,
          showSummary: true,
          version: '42',
        })
      ).toEqual({
        configFile: 'pcgen.js',
        generator: undefined,
        logLevel: LogLevel.Trace,
        showBasePath: true,
        showCommands: true,
        showDetails: true,
        showOptions: false,
        showSummary: true,
        tag: [],
        version: '42',
      });
    });
  });
});

describe('requiredRunOptions', () => {
  beforeEach(() => {});

  it('should be a function', () =>
    expect(typeof requiredRunOptions).toBe('function'));

  describe('When no options are given', () => {
    it('should return default options', async () => {
      expect(requiredRunOptions()).toEqual({
        command: '',
        configFile: 'pcgen.config.js',
        dryRun: false,
        generator: undefined,
        logLevel: 3,
        outDir: undefined,
        overwrite: undefined,
        phases: '',
        showOptions: false,
        stdout: false,
        stepTag: [],
        tag: [],
        version: '',
      });
    });
  });

  describe('When all options are given', () => {
    it('should return given options', async () => {
      expect(
        requiredRunOptions({
          command: 'run',
          configFile: 'pcgen.js',
          dryRun: true,
          generator: 'sample',
          logLevel: 4,
          outDir: '..',
          overwrite: true,
          phases: 'all',
          showOptions: true,
          stdout: true,
          stepTag: ['builtin'],
          tag: ['tag1'],
          version: '42',
        })
      ).toEqual({
        command: 'run',
        configFile: 'pcgen.js',
        dryRun: true,
        generator: 'sample',
        logLevel: 4,
        outDir: '..',
        overwrite: true,
        phases: 'all',
        showOptions: true,
        stdout: true,
        stepTag: ['builtin'],
        tag: ['tag1'],
        version: '42',
      });
    });
  });

  describe('When some options are given', () => {
    it('should return merged options', async () => {
      expect(
        requiredRunOptions({
          command: 'run',
          dryRun: true,
          logLevel: 4,
          outDir: '..',
          showOptions: true,
          stdout: true,
          version: '42',
        })
      ).toEqual({
        command: 'run',
        configFile: 'pcgen.config.js',
        dryRun: true,
        generator: undefined,
        logLevel: 4,
        outDir: '..',
        overwrite: undefined,
        phases: '',
        showOptions: true,
        stdout: true,
        stepTag: [],
        tag: [],
        version: '42',
      });
    });
  });
});
