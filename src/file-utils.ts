import pathModule from 'path';
import fs from 'fs-extra';
import glob from 'glob';

export function joinPaths(...paths: string[]): string {
  for (let index = paths.length - 1; index > 0; index--) {
    const element = paths[index];
    if (pathModule.isAbsolute(element)) {
      return joinPaths(...paths.slice(index));
    }
  }
  return pathModule.join(...paths);
}

export async function fsStatsOrNull(path: string): Promise<fs.Stats | null> {
  try {
    const stats = await fs.stat(path);
    return stats;
  } catch (error) {
    if (error.code == 'ENOENT') {
      return null;
    } else {
      throw error;
    }
  }
}

export async function fsExistsAsFile(path: string): Promise<boolean> {
  return (await fsStatsOrNull(path))?.isFile() ?? false;
}

export async function fsExistsAsDirectory(path: string): Promise<boolean> {
  return (await fsStatsOrNull(path))?.isDirectory() ?? false;
}

export async function fsReadFileContent(
  path: string
): Promise<string | undefined> {
  try {
    return await fs.readFile(path, 'utf-8');
  } catch (error) {
    if (error.code == 'ENOENT') {
      return undefined;
    } else {
      throw error;
    }
  }
}

export async function fsWriteFileContent(
  path: string,
  text: string
): Promise<void> {
  await fs.ensureDir(pathModule.dirname(path));

  await fs.writeFile(path, text, 'utf-8');
}

export async function fsReadDir(
  path: string,
  predicate?: (fileName: string) => boolean | Promise<boolean>
): Promise<string[]> {
  try {
    const allFiles = await fs.readdir(path);
    if (predicate) {
      const result: string[] = [];
      for (const file of allFiles) {
        if (await predicate(file)) {
          result.push(file);
        }
      }
      return result;
    } else {
      return allFiles;
    }
  } catch (error) {
    if (error.code == 'ENOENT') {
      return [];
    } else {
      throw error;
    }
  }
}

export function fsListFiles(path: string): Promise<string[]> {
  return fsReadDir(path, (file) => fsExistsAsFile(pathModule.join(path, file)));
}

export function fsListDirectories(path: string): Promise<string[]> {
  return fsReadDir(path, (file) =>
    fsExistsAsDirectory(pathModule.join(path, file))
  );
}

export async function globFiles(basePath: string, filePattern: string): Promise<string[]> {
  try {
    const result = await new Promise<string[]>((resolve, reject) => {
      glob(joinPaths(basePath, filePattern), (error, matches) => {
        if (error) {
          reject(error)
        } else {
          resolve(matches)
        }
      })
    }) 
    
    return result;
  } catch (error) {
    if (error.code == 'ENOENT') {
      return [];
    } else {
      throw error;
    }
  }
}
