import consola, { LogLevel } from 'consola';
import { parseLogLevel } from '../logging';
import {
  getOptions,
  addGlobalOptions,
  addSearchOptions,
  addPrintOptions,
  addOutputOptions,
} from '../options';
import { OutputOptionsOnly, PrintOptionsOnly } from '../types';

describe('getOptions', () => {
  beforeAll(() => {
    consola.wrapAll();
  });
  beforeEach(() => {
    consola.mockTypes(() => jest.fn());
  });

  it('should be a function', () => expect(typeof getOptions).toBe('function'));

  describe('When args do not have a parents options', () => {
    it('should return the result of the opts function', () => {
      const args = {
        opts() {
          return {
            option1: 'value1',
            option2: 'value2',
          };
        },
      };

      const actual = getOptions(args);

      const expected = {
        option1: 'value1',
        option2: 'value2',
      };

      expect(actual).toEqual(expected);
    });
  });

  describe('When args have parents options', () => {
    it('should return the merged result of parent and child options', () => {
      const args = {
        opts() {
          return {
            option1: 'value1',
            option2: 'value2',
          };
        },
        parent: {
          opts() {
            return {
              parent1: 'pvalue1',
              parent2: 'pvalue2',
            };
          },
        },
      };

      const actual = getOptions(args);

      const expected = {
        parent1: 'pvalue1',
        parent2: 'pvalue2',
        option1: 'value1',
        option2: 'value2',
      };

      expect(actual).toEqual(expected);
    });
  });

  describe('When args have ancestors options', () => {
    it('should return the merged result of all ancestors and child options', () => {
      const args = {
        opts() {
          return {
            option1: 'value1',
            option2: 'value2',
          };
        },
        parent: {
          opts() {
            return {
              parent1: 'pvalue1',
              parent2: 'pvalue2',
            };
          },
          parent: {
            opts() {
              return {
                ancestor1: 'avalue1',
                ancestor2: 'avalue2',
              };
            },
          },
        },
      };

      const actual = getOptions(args);

      const expected = {
        ancestor1: 'avalue1',
        ancestor2: 'avalue2',
        parent1: 'pvalue1',
        parent2: 'pvalue2',
        option1: 'value1',
        option2: 'value2',
      };

      expect(actual).toEqual(expected);
    });
  });
});

describe('addGlobalOptions', () => {
  beforeAll(() => {
    consola.wrapAll();
  });
  beforeEach(() => {
    consola.mockTypes(() => jest.fn());
  });

  it('should be a function', () =>
    expect(typeof addGlobalOptions).toBe('function'));

  describe('When given a command', () => {
    let command: { option: jest.Mock<any, any> };

    beforeEach(() => {
      command = {
        option: jest.fn().mockImplementation(() => command),
      };
    });

    it('should add --config-file option', () => {
      const actual = addGlobalOptions(command as any);
      expect(actual).toBe(command);
      expect(command.option).toHaveBeenCalledWith(
        expect.stringMatching('--config-file <.+>'),
        expect.any(String)
      );
    });

    it('should add --show-options option', () => {
      const actual = addGlobalOptions(command as any);
      expect(actual).toBe(command);
      expect(command.option).toHaveBeenCalledWith(
        '--show-options',
        expect.any(String),
        false
      );
    });

    it('should add --log-level option', () => {
      const actual = addGlobalOptions(command as any);
      expect(actual).toBe(command);
      expect(command.option).toHaveBeenCalledWith(
        expect.stringMatching('-l, --log-level <.+>'),
        expect.any(String),
        parseLogLevel,
        LogLevel.Info
      );
    });
  });
});

describe('addSearchOptions', () => {
  beforeAll(() => {
    consola.wrapAll();
  });
  beforeEach(() => {
    consola.mockTypes(() => jest.fn());
  });

  it('should be a function', () =>
    expect(typeof addSearchOptions).toBe('function'));

  describe('When given a command', () => {
    let command: { option: jest.Mock<any, any> };

    beforeEach(() => {
      command = {
        option: jest.fn().mockImplementation(() => command),
      };
    });

    it('should add --tag option', () => {
      const actual = addSearchOptions(command as any);
      expect(actual).toBe(command);
      expect(command.option).toHaveBeenCalledWith(
        expect.stringMatching('-t, --tag <.+\\.\\.\\.>'),
        expect.any(String)
      );
    });
  });
});

describe('addPrintOptions', () => {
  beforeAll(() => {
    consola.wrapAll();
  });
  beforeEach(() => {
    consola.mockTypes(() => jest.fn());
  });

  it('should be a function', () =>
    expect(typeof addPrintOptions).toBe('function'));

  describe('When given a command', () => {
    let command: { option: jest.Mock<any, any> };

    const printOptions: PrintOptionsOnly = {
      showBasePath: false,
      showCommands: true,
      showDetails: undefined,
      showSummary: true,
    };

    beforeEach(() => {
      command = {
        option: jest.fn().mockImplementation(() => command),
      };
    });

    it('should add --show-path option', () => {
      const actual = addPrintOptions(command as any, printOptions);
      expect(actual).toBe(command);
      expect(command.option).toHaveBeenCalledWith(
        expect.stringContaining('-p, --show-path'),
        expect.any(String),
        printOptions.showBasePath
      );
    });

    it('should add --show-summary option', () => {
      const actual = addPrintOptions(command as any, printOptions);
      expect(actual).toBe(command);
      expect(command.option).toHaveBeenCalledWith(
        expect.stringContaining('-s, --show-summary'),
        expect.any(String),
        printOptions.showSummary
      );
    });

    it('should add --show-details option', () => {
      const actual = addPrintOptions(command as any, printOptions);
      expect(actual).toBe(command);
      expect(command.option).toHaveBeenCalledWith(
        expect.stringContaining('-d, --show-details'),
        expect.any(String),
        printOptions.showDetails
      );
    });

    it('should add --show-commands option', () => {
      const actual = addPrintOptions(command as any, printOptions);
      expect(actual).toBe(command);
      expect(command.option).toHaveBeenCalledWith(
        expect.stringContaining('-c, --show-commands'),
        expect.any(String),
        printOptions.showCommands
      );
    });
  });
});

describe('addOutputOptions', () => {
  beforeAll(() => {
    consola.wrapAll();
  });
  beforeEach(() => {
    consola.mockTypes(() => jest.fn());
  });

  it('should be a function', () =>
    expect(typeof addOutputOptions).toBe('function'));

  describe('When given a command', () => {
    let command: { option: jest.Mock<any, any> };

    const outputOptions: OutputOptionsOnly = {
      outDir: './output',
      overwrite: true,
    };

    beforeEach(() => {
      command = {
        option: jest.fn().mockImplementation(() => command),
      };
    });

    it('should add --out-dir option', () => {
      const actual = addOutputOptions(command as any, outputOptions);
      expect(actual).toBe(command);
      expect(command.option).toHaveBeenCalledWith(
        expect.stringMatching('--out-dir <.+>'),
        expect.any(String),
        outputOptions.outDir
      );
    });

    it('with no extra options should add --out-dir option', () => {
      const actual = addOutputOptions(command as any);
      expect(actual).toBe(command);
      expect(command.option).toHaveBeenCalledWith(
        expect.stringMatching('--out-dir <.+>'),
        expect.any(String),
        undefined
      );
    });

    it('should add --overwrite option', () => {
      const actual = addOutputOptions(command as any, outputOptions);
      expect(actual).toBe(command);
      expect(command.option).toHaveBeenCalledWith(
        expect.stringContaining('-w, --overwrite'),
        expect.any(String),
        outputOptions.overwrite
      );
    });

    it('with no extra options should add --overwrite option', () => {
      const actual = addOutputOptions(command as any);
      expect(actual).toBe(command);
      expect(command.option).toHaveBeenCalledWith(
        expect.stringContaining('-w, --overwrite'),
        expect.any(String),
        undefined
      );
    });

    it('should add --no-overwrite option', () => {
      const actual = addOutputOptions(command as any, outputOptions);
      expect(actual).toBe(command);
      expect(command.option).toHaveBeenCalledWith(
        expect.stringContaining('--no-overwrite'),
        expect.any(String)
      );
    });

    it('with no extra options should add --no-overwrite option', () => {
      const actual = addOutputOptions(command as any);
      expect(actual).toBe(command);
      expect(command.option).toHaveBeenCalledWith(
        expect.stringContaining('--no-overwrite'),
        expect.any(String)
      );
    });
  });
});
