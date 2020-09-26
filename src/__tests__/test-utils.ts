/* istanbul ignore file */
import fs from 'fs-extra';

export function createCodedError(message: string, code: string) {
  const error = new Error(message);
  Object.defineProperty(error, 'code', {
    get: () => code,
  });
  return error;
}

export type ReadFileFunc = (file: string, encoding: string) => Promise<string>;
export type ReadFileNotFound = (
  file?: string,
  encoding?: string
) => string | Promise<string>;

export type ReadFileContent =
  | string
  | ((file: string, encoding: string) => string | Promise<string>);

export function mockReadFilesFor(
  readFile: ReadFileFunc,
  files: Record<string, ReadFileContent>,
  notFound?: ReadFileNotFound
) {
  const readFileMock = (readFile as any) as jest.Mock<
    Promise<string>,
    [string, string]
  >;
  readFileMock.mockReset();

  readFileMock.mockImplementation(async (filePath, encoding) => {
    const content = files[filePath];
    if (typeof content === 'string') {
      return content;
    } else if (typeof content === 'function') {
      return await content(filePath, encoding);
    } else if (!!notFound) {
      return await notFound(filePath, encoding);
    } else {
      throw createCodedError('', 'ENOENT');
    }
  });

  return readFileMock;
}

export function mockReadFileFor(
  readFile: ReadFileFunc,
  filePath: string,
  content: ReadFileContent,
  notFound?: ReadFileNotFound
) {
  return mockReadFilesFor(
    readFile,
    {
      [filePath]: content,
    },
    notFound
  );
}

export type WriteFileFunc = (
  file: string,
  content: string,
  encoding: string
) => Promise<void>;
export type WriteFileNotFound = (
  file?: string,
  content?: string,
  encoding?: string
) => void | Promise<void>;

export type WriteFileContent =
  | string
  | ((file: string, content: string, encoding: string) => void | Promise<void>);

export function mockWriteFilesFor(
  writeFile: WriteFileFunc,
  files: Record<string, WriteFileContent>,
  notFound?: WriteFileNotFound
) {
  const writeFileMock = (writeFile as any) as jest.Mock<
    Promise<void>,
    [string, string, string]
  >;
  writeFileMock.mockReset();

  writeFileMock.mockImplementation(async (filePath, content, encoding) => {
    const current = files[filePath];
    if (typeof current === 'string') {
      files[filePath] = content;
      return;
    } else if (typeof current === 'function') {
      return await current(filePath, content, encoding);
    } else if (notFound) {
      await notFound(filePath, content, encoding);
    } else {
      files[filePath] = content;
      return;
    }
  });

  return writeFileMock;
}

export function mockWriteFileFor(
  writeFile: WriteFileFunc,
  filePath: string,
  current?: WriteFileContent,
  notFound?: WriteFileNotFound
) {
  return mockWriteFilesFor(
    writeFile,
    {
      [filePath]: current || '',
    },
    notFound
  );
}

export type StatsFunc = (filePath: string) => Promise<fs.Stats>;
export type StatsNotFound = (filePath?: string) => fs.Stats | Promise<fs.Stats>;

export type StatsContent =
  | 'file'
  | 'directory'
  | fs.Stats
  | ((filePath: string) => fs.Stats | Promise<fs.Stats>);

export function mockStatsFor(
  stat: StatsFunc,
  files: Record<string, StatsContent>,
  notFound?: StatsNotFound
) {
  const statMock = (stat as any) as jest.Mock<Promise<fs.Stats>, [string]>;
  statMock.mockReset();

  statMock.mockImplementation(async (filePath: string) => {
    const current = files[filePath];
    if (current === 'file') {
      return {
        isFile: () => true,
        isDirectory: () => false,
      } as fs.Stats;
    } else if (current === 'directory') {
      return {
        isFile: () => false,
        isDirectory: () => true,
      } as fs.Stats;
    } else if (typeof current === 'object') {
      return current;
    } else if (typeof current === 'function') {
      return await current(filePath);
    } else if (notFound) {
      return await notFound(filePath);
    } else {
      throw createCodedError('', 'ENOENT');
    }
  });

  return statMock;
}

export function mockStatFor(
  stat: StatsFunc,
  filePath: string,
  stats: StatsContent,
  notFound?: StatsNotFound
) {
  return mockStatsFor(
    stat,
    {
      [filePath]: stats,
    },
    notFound
  );
}

export type ReadDirFunc = (filePath: string) => Promise<string[]>;
export type ReadDirNotFound = (
  filePath?: string
) => string[] | Promise<string[]>;

export type ReadDirContent =
  | string[]
  | ((filePath: string) => string[] | Promise<string[]>);

export function mockReadDirsFor(
  readDir: ReadDirFunc,
  files: Record<string, ReadDirContent>,
  notFound?: ReadDirNotFound
) {
  const readDirMock = (readDir as any) as jest.Mock<
    Promise<string[]>,
    [string]
  >;
  readDirMock.mockReset();

  readDirMock.mockImplementation(async (filePath) => {
    const current = files[filePath];
    if (Array.isArray(current)) {
      return current;
    } else if (typeof current === 'function') {
      return await current(filePath);
    } else if (notFound) {
      return await notFound(filePath);
    } else {
      throw createCodedError('', 'ENOENT');
    }
  });

  return readDirMock;
}

export function mockReadDirFor(
  readDir: ReadDirFunc,
  filePath: string,
  content: ReadDirContent,
  notFound?: ReadDirNotFound
) {
  return mockReadDirsFor(
    readDir,
    {
      [filePath]: content,
    },
    notFound
  );
}
