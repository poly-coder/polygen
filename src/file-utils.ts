import fs from 'fs-extra';

export async function fsStatsOrNull(path: string): Promise<fs.Stats | null> {
    try {
        const stats = await fs.stat(path)
        return stats;
    } catch (error) {
        if (error?.code == 'ENOENT') {
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

export async function fsReadFileContent(path: string): Promise<string | null> {
    try {
        return await fs.readFile(path, "utf-8")
    } catch (error) {
        if (error?.code == 'ENOENT') {
            return null;
        } else {
            throw error;
        }
    }
}
