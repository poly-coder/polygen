import fs from 'fs-extra';
import { loadConfigurationFile } from '../generator';
import { mockFileSystem } from './test-utils';

jest.mock('fs-extra')

describe('loadConfigurationFile', () => {
  beforeEach(() => {
  });
  
  it('should be a function', () => expect(typeof loadConfigurationFile).toBe('function'));

  describe('When no configuration file exists', () => {
    it('should return undefined', async () => {
      const fileSystem = mockFileSystem(fs)
      
      const config = await loadConfigurationFile(undefined)

      expect(fileSystem.stat).toHaveBeenCalledTimes(1)
      expect(config).toBeUndefined()
    });
  });
});
