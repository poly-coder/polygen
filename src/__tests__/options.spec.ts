import consola from 'consola';
import { getOptions } from '../options';

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
