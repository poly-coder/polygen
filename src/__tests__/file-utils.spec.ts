import fs from 'fs-extra';
import consola from 'consola';
import path from 'path';
import {
  fsExistsAsDirectory,
  fsExistsAsFile,
  fsListDirectories,
  fsListFiles,
  fsReadDir,
  fsReadFileContent,
  fsStatsOrNull,
  fsWriteFileContent,
  joinPaths,
} from '../file-utils';
import {
  createCodedError,
  mockReadDirFor,
  mockReadFileFor,
  mockStatFor,
  mockStatsFor,
  mockWriteFileFor,
} from './test-utils';

jest.mock('fs-extra');

describe('joinPaths', () => {
  beforeAll(() => {
    consola.wrapAll();
  });
  beforeEach(() => {
    consola.mockTypes(() => jest.fn());
  });

  it('should be a function', () => expect(typeof joinPaths).toBe('function'));

  it('with no parameters it should return current directory "."', () =>
    expect(joinPaths()).toBe('.'));

  it('with no absolute paths it should return the same as path.join', () =>
    expect(joinPaths('relative', 'path', 'somewhere')).toBe(
      path.join('relative', 'path', 'somewhere')
    ));

  it('with first absolute paths it should return the same as path.join', () =>
    expect(joinPaths('/absolute', 'path', 'somewhere')).toBe(
      path.join('/absolute', 'path', 'somewhere')
    ));

  it('with previous absolute paths it should return the same as path.join starting from the last absolute path', () =>
    expect(
      joinPaths('/first', 'path', '/second', 'path', '/last', 'path')
    ).toBe(path.join('/last', 'path')));
});

describe('fsStatsOrNull', () => {
  beforeAll(() => {
    consola.wrapAll();
  });
  beforeEach(() => {
    consola.mockTypes(() => jest.fn());
  });

  it('should be a function', () =>
    expect(typeof fsStatsOrNull).toBe('function'));

  it('with an existing file it should return its stats', async () => {
    const fileName = 'file.txt';

    const stat = mockStatFor(fs.stat, fileName, 'file');

    const stats = await fsStatsOrNull(fileName)
    expect(stats).not.toBeUndefined();
    expect(stats?.isFile?.()).toBeTruthy();
    expect(stat).toHaveBeenCalledTimes(1);
    expect(stat).toHaveBeenNthCalledWith(1, fileName);
  });

  it('with non-existing file it should return null', async () => {
    const expected: fs.Stats = {} as fs.Stats;
    const fileName = 'file.txt';

    const stat = mockStatFor(fs.stat, 'other-file.txt', expected);

    expect(await fsStatsOrNull(fileName)).toBeNull();
    expect(stat).toHaveBeenCalledTimes(1);
    expect(stat).toHaveBeenNthCalledWith(1, fileName);
  });

  it('with inaccessible file it should throw the same error', async () => {
    const expected: fs.Stats = {} as fs.Stats;
    const fileName = 'file.txt';

    const stat = mockStatFor(fs.stat, 'other-file.txt', expected, () => {
      throw createCodedError('Cannot access file', 'NOACCESS');
    });

    await expect(fsStatsOrNull(fileName)).rejects.toThrowError(
      /Cannot access file/
    );
    expect(stat).toHaveBeenCalledTimes(1);
    expect(stat).toHaveBeenNthCalledWith(1, fileName);
  });
});

describe('fsExistsAsFile', () => {
  beforeAll(() => {
    consola.wrapAll();
  });
  beforeEach(() => {
    consola.mockTypes(() => jest.fn());
  });

  it('should be a function', () =>
    expect(typeof fsExistsAsFile).toBe('function'));

  it('with an existing file it should return true', async () => {
    const expected: fs.Stats = {
      isFile: () => true,
      isDirectory: () => false,
    } as fs.Stats;
    const fileName = 'file';

    const stat = mockStatFor(fs.stat, fileName, expected);

    expect(await fsExistsAsFile(fileName)).toBe(true);
    expect(stat).toHaveBeenCalledTimes(1);
    expect(stat).toHaveBeenNthCalledWith(1, fileName);
  });

  it('with an existing directory it should return false', async () => {
    const expected: fs.Stats = {
      isFile: () => false,
      isDirectory: () => true,
    } as fs.Stats;
    const fileName = 'directory';

    const stat = mockStatFor(fs.stat, fileName, expected);

    expect(await fsExistsAsFile(fileName)).toBe(false);
    expect(stat).toHaveBeenCalledTimes(1);
    expect(stat).toHaveBeenNthCalledWith(1, fileName);
  });

  it('with non-existing file it should return false', async () => {
    const expected: fs.Stats = {
      isFile: () => true,
      isDirectory: () => false,
    } as fs.Stats;
    const fileName = 'file.txt';

    const stat = mockStatFor(fs.stat, 'other-file.txt', expected);

    expect(await fsExistsAsFile(fileName)).toBe(false);
    expect(stat).toHaveBeenCalledTimes(1);
    expect(stat).toHaveBeenNthCalledWith(1, fileName);
  });

  it('with inaccessible file it should throw the same error', async () => {
    const expected: fs.Stats = {} as fs.Stats;
    const fileName = 'file.txt';

    const stat = mockStatFor(fs.stat, 'other-file.txt', expected, () => {
      throw createCodedError('Cannot access file', 'NOACCESS');
    });

    await expect(fsExistsAsFile(fileName)).rejects.toThrowError(
      /Cannot access file/
    );
    expect(stat).toHaveBeenCalledTimes(1);
    expect(stat).toHaveBeenNthCalledWith(1, fileName);
  });
});

describe('fsExistsAsDirectory', () => {
  beforeAll(() => {
    consola.wrapAll();
  });
  beforeEach(() => {
    consola.mockTypes(() => jest.fn());
  });

  it('should be a function', () =>
    expect(typeof fsExistsAsDirectory).toBe('function'));

  it('with an existing file it should return false', async () => {
    const expected: fs.Stats = {
      isFile: () => true,
      isDirectory: () => false,
    } as fs.Stats;
    const fileName = 'file';

    const stat = mockStatFor(fs.stat, fileName, expected);

    expect(await fsExistsAsDirectory(fileName)).toBe(false);
    expect(stat).toHaveBeenCalledTimes(1);
    expect(stat).toHaveBeenNthCalledWith(1, fileName);
  });

  it('with an existing directory it should return true', async () => {
    const expected: fs.Stats = {
      isFile: () => false,
      isDirectory: () => true,
    } as fs.Stats;
    const fileName = 'directory';

    const stat = mockStatFor(fs.stat, fileName, expected);

    expect(await fsExistsAsDirectory(fileName)).toBe(true);
    expect(stat).toHaveBeenCalledTimes(1);
    expect(stat).toHaveBeenNthCalledWith(1, fileName);
  });

  it('with non-existing file it should return false', async () => {
    const expected: fs.Stats = {
      isFile: () => true,
      isDirectory: () => false,
    } as fs.Stats;
    const fileName = 'file.txt';

    const stat = mockStatFor(fs.stat, 'other-file.txt', expected);

    expect(await fsExistsAsDirectory(fileName)).toBe(false);
    expect(stat).toHaveBeenCalledTimes(1);
    expect(stat).toHaveBeenNthCalledWith(1, fileName);
  });

  it('with inaccessible file it should throw the same error', async () => {
    const fileName = 'directory';

    const stat = mockStatFor(fs.stat, fileName, () => {
      throw createCodedError('Cannot access file', 'NOACCESS');
    });

    await expect(fsExistsAsDirectory(fileName)).rejects.toThrowError(
      /Cannot access file/
    );
    expect(stat).toHaveBeenCalledTimes(1);
    expect(stat).toHaveBeenNthCalledWith(1, fileName);
  });
});

describe('fsReadFileContent', () => {
  beforeAll(() => {
    consola.wrapAll();
  });
  beforeEach(() => {
    consola.mockTypes(() => jest.fn());
  });

  it('should be a function', () =>
    expect(typeof fsReadFileContent).toBe('function'));

  it('with an existing file it should return its content', async () => {
    const expected: string = 'This is the file content';
    const fileName = 'file.txt';

    const readFile = mockReadFileFor(fs.readFile, fileName, expected);

    expect(await fsReadFileContent(fileName)).toBe(expected);
    expect(readFile).toHaveBeenCalledTimes(1);
    expect(readFile).toHaveBeenNthCalledWith(1, fileName, 'utf-8');
  });

  it('with non-existing file it should return undefined', async () => {
    const expected: string = 'This is the file content';
    const fileName = 'file.txt';

    const readFile = mockReadFileFor(fs.readFile, 'other-file.txt', expected);

    expect(await fsReadFileContent(fileName)).toBeUndefined();
    expect(readFile).toHaveBeenCalledTimes(1);
    expect(readFile).toHaveBeenNthCalledWith(1, fileName, 'utf-8');
  });

  it('with inaccessible file it should throw the same error', async () => {
    const expected: string = 'This is the file content';
    const fileName = 'file.txt';

    const readFile = mockReadFileFor(
      fs.readFile,
      'other-file.txt',
      expected,
      () => {
        throw createCodedError('Cannot access file', 'NOACCESS');
      }
    );

    await expect(fsReadFileContent(fileName)).rejects.toThrowError(
      /Cannot access file/
    );
    expect(readFile).toHaveBeenCalledTimes(1);
    expect(readFile).toHaveBeenNthCalledWith(1, fileName, 'utf-8');
  });
});

describe('fsWriteFileContent', () => {
  beforeAll(() => {
    consola.wrapAll();
  });
  beforeEach(() => {
    consola.mockTypes(() => jest.fn());
  });

  it('should be a function', () =>
    expect(typeof fsWriteFileContent).toBe('function'));

  it('with an existing file it should return its content', async () => {
    const content: string = 'This is the file content';
    const fileName = 'file.txt';

    const writeFile = mockWriteFileFor(fs.writeFile, fileName);

    await fsWriteFileContent(fileName, content);
    expect(writeFile).toHaveBeenCalledTimes(1);
    expect(writeFile).toHaveBeenNthCalledWith(1, fileName, content, 'utf-8');
  });

  it('with inaccessible file it should throw the same error', async () => {
    const content: string = 'This is the file content';
    const fileName = 'file.txt';

    const writeFile = mockWriteFileFor(fs.writeFile, 'file.txt', () => {
      throw createCodedError('Cannot access file', 'NOACCESS');
    });

    await expect(fsWriteFileContent(fileName, content)).rejects.toThrowError(
      /Cannot access file/
    );
    expect(writeFile).toHaveBeenCalledTimes(1);
    expect(writeFile).toHaveBeenNthCalledWith(1, fileName, content, 'utf-8');
  });
});

describe('fsReadDir', () => {
  beforeAll(() => {
    consola.wrapAll();
  });
  beforeEach(() => {
    consola.mockTypes(() => jest.fn());
  });

  it('should be a function', () => expect(typeof fsReadDir).toBe('function'));

  it('with an existing directory and no predicate it should return all its content', async () => {
    const expected: string[] = ['file1, file2', 'dir1', 'dir2'];
    const fileName = 'directory';

    const stat = mockReadDirFor(fs.readdir, fileName, expected);

    expect(await fsReadDir(fileName)).toEqual(expected);
    expect(stat).toHaveBeenCalledTimes(1);
    expect(stat).toHaveBeenNthCalledWith(1, fileName);
  });

  it('with an existing directory and a predicate it should return filtered content', async () => {
    const expected: string[] = ['file1, file2', 'dir1', 'dir2'];
    const fileName = 'directory';

    const stat = mockReadDirFor(fs.readdir, fileName, expected);

    expect(await fsReadDir(fileName, (n) => n.startsWith('dir'))).toEqual([
      'dir1',
      'dir2',
    ]);
    expect(stat).toHaveBeenCalledTimes(1);
    expect(stat).toHaveBeenNthCalledWith(1, fileName);
  });

  it('with non-existing directory it should return empty list', async () => {
    const expected: string[] = ['file1, file2', 'dir1', 'dir2'];
    const fileName = 'directory';

    const stat = mockReadDirFor(fs.readdir, 'other-directory', expected);

    expect(await fsReadDir(fileName)).toEqual([]);
    expect(stat).toHaveBeenCalledTimes(1);
    expect(stat).toHaveBeenNthCalledWith(1, fileName);
  });

  it('with inaccessible directory it should throw the same error', async () => {
    const expected: string[] = ['file1, file2', 'dir1', 'dir2'];
    const fileName = 'directory';

    const stat = mockReadDirFor(fs.readdir, 'other-directory', expected, () => {
      throw createCodedError('Cannot access file', 'NOACCESS');
    });

    await expect(fsReadDir(fileName)).rejects.toThrowError(
      /Cannot access file/
    );
    expect(stat).toHaveBeenCalledTimes(1);
    expect(stat).toHaveBeenNthCalledWith(1, fileName);
  });
});

describe('fsListFiles', () => {
  beforeAll(() => {
    consola.wrapAll();
  });
  beforeEach(() => {
    consola.mockTypes(() => jest.fn());
  });

  it('should be a function', () => expect(typeof fsListFiles).toBe('function'));

  it('with an existing directory  with files and directories, it should return all its files', async () => {
    const expected: string[] = ['file1', 'file2', 'dir1', 'dir2'];
    const fileName = 'directory';

    const readDir = mockReadDirFor(fs.readdir, fileName, expected);
    const stat = mockStatsFor(fs.stat, {
      [path.join(fileName, 'file1')]: 'file',
      [path.join(fileName, 'file2')]: 'file',
      [path.join(fileName, 'dir1')]: 'directory',
      [path.join(fileName, 'dir2')]: 'directory',
    });

    const actual = await fsListFiles(fileName);
    expect(readDir).toHaveBeenCalledTimes(1);
    expect(readDir).toHaveBeenNthCalledWith(1, fileName);
    expect(stat).toHaveBeenCalledTimes(4);
    expect(stat).toHaveBeenNthCalledWith(1, path.join(fileName, 'file1'));
    expect(stat).toHaveBeenNthCalledWith(2, path.join(fileName, 'file2'));
    expect(stat).toHaveBeenNthCalledWith(3, path.join(fileName, 'dir1'));
    expect(stat).toHaveBeenNthCalledWith(4, path.join(fileName, 'dir2'));
    expect(actual).toEqual(['file1', 'file2']);
  });
});

describe('fsListDirectories', () => {
  beforeAll(() => {
    consola.wrapAll();
  });
  beforeEach(() => {
    consola.mockTypes(() => jest.fn());
  });

  it('should be a function', () => expect(typeof fsListDirectories).toBe('function'));

  it('with an existing directory  with files and directories, it should return all its files', async () => {
    const expected: string[] = ['file1', 'file2', 'dir1', 'dir2'];
    const fileName = 'directory';

    const readDir = mockReadDirFor(fs.readdir, fileName, expected);
    const stat = mockStatsFor(fs.stat, {
      [path.join(fileName, 'file1')]: 'file',
      [path.join(fileName, 'file2')]: 'file',
      [path.join(fileName, 'dir1')]: 'directory',
      [path.join(fileName, 'dir2')]: 'directory',
    });

    const actual = await fsListDirectories(fileName);
    expect(readDir).toHaveBeenCalledTimes(1);
    expect(readDir).toHaveBeenNthCalledWith(1, fileName);
    expect(stat).toHaveBeenCalledTimes(4);
    expect(stat).toHaveBeenNthCalledWith(1, path.join(fileName, 'file1'));
    expect(stat).toHaveBeenNthCalledWith(2, path.join(fileName, 'file2'));
    expect(stat).toHaveBeenNthCalledWith(3, path.join(fileName, 'dir1'));
    expect(stat).toHaveBeenNthCalledWith(4, path.join(fileName, 'dir2'));
    expect(actual).toEqual(['dir1', 'dir2']);
  });
});
