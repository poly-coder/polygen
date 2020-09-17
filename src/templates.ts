import path from 'path';
import fs from 'fs-extra';
import { Consola } from 'consola';
import chalk from 'chalk';
import { fsExistsAsDirectory, fsReadFileContent } from './file-utils';

type Mutable<T> = {
    -readonly[P in keyof T]: T[P]
};

export interface ITemplateSystem {
    readonly isInitialized: () => Promise<boolean>;
    readonly ensureInitialized: () => Promise<boolean>;
    readonly initialize: () => Promise<void>;
    readonly fetchTemplateInfo: (name: string, options: FetchTemplateInfoOptions) => Promise<TemplateInfo | null>;
    readonly fetchTemplatesInfo: (options: FetchTemplateInfoOptions) => Promise<TemplateInfo[]>;

    readonly getProjectPath: (name: string) => string;
    readonly existsProject: (name: string) => Promise<boolean>;
    readonly createProject: (name: string) => Promise<void>;
}

export interface FetchTemplateInfoOptions {
    readonly details: boolean;
}

export type GeneratorEngine = "ejs" | "handlebars" | "liquid" | "mustache" | "nunjucks" | "pug" | "copy";
export type DefaultGeneratorEngine = GeneratorEngine | "default";

export interface GeneratorProjectDescriptor {
    readonly details?: any;
    readonly engine?: DefaultGeneratorEngine;
}

export interface TemplateInfo {
    readonly name: string;
    readonly details?: any;
    readonly engine?: any;
    
    readonly projectInfo?: GeneratorProjectDescriptor;
}

export function createTemplateSystem(console: Consola): ITemplateSystem {
    // TODO: Define POLYGEN_TEMPLATES env var
    // TODO: Define polygen.json for configuration
    // TODO: Look for parent folders when not found?

    const templatesFolder = '_templates'
    const generatorFolder = 'generator'
    const templatesBasePath = path.join(process.cwd(), templatesFolder)
    // const defaultCommand = 'index'
    const generatorAssets = path.join(__dirname, '../assets/generator') 

    const projectFolder = (name: string) => path.join(templatesFolder, name)
    const projectItemPath = (project: string, relativePath: string) => path.join(templatesFolder, project, relativePath)

    const isInitialized = () => fsExistsAsDirectory(templatesBasePath)

    const ensureInitialized = async () => {
        if (!(await isInitialized())) {
            console.info('You must use command ', chalk.greenBright("'polygen init'"), ' before start using polygen')
            return false;
        }
        return true;
    }

    const initialize = async () => {
        if (!(await isInitialized())) {
            console.trace('Initializing polygen ...')
            fs.copy(generatorAssets, projectFolder(generatorFolder))
        }
    }

    const ensureProjectDesc = async (name: string, projDesc: GeneratorProjectDescriptor | undefined): Promise<GeneratorProjectDescriptor> => {
        if (projDesc) {
            return projDesc;
        }

        const jsonPath = projectItemPath(name, `${name}.json`)
        const jsonContent = await fsReadFileContent(jsonPath)
        if (jsonContent) {
            try {
                projDesc = JSON.parse(jsonContent) as GeneratorProjectDescriptor;
                console.trace('Read project descriptor from ', jsonPath)
                console.trace('project descriptor ', projDesc)
                return projDesc;
            } catch (error) {
            }
        }

        return {}
    }

    const fetchTemplateInfo = async (name: string, options: FetchTemplateInfoOptions) => {
        const folder = projectFolder(name)
        const info: Mutable<TemplateInfo> = {
            name,
        }
        let projDesc: GeneratorProjectDescriptor | undefined;

        if (await fsExistsAsDirectory(folder)) {
            if (options.details) {
                projDesc = await ensureProjectDesc(name, projDesc)
                info.engine = projDesc?.engine
                info.details = projDesc?.details
            }

            return info as TemplateInfo;
        }
        
        return null
    }

    const fetchTemplatesInfo = async (options: FetchTemplateInfoOptions) => {
        const files = await fs.readdir(templatesBasePath)
        const infos: TemplateInfo[] = []
        
        console.trace(`Searching generator projects at ${templatesBasePath}`)
        for (const name of files) {
            const info = await fetchTemplateInfo(name, options)
            if (!!info) {
                console.trace(`Found generator project named "${name}"`)
    
                infos.push(info)
            } else {
                console.trace(`Found invalid generator project file ${name}`)
            }
        }

        return infos;
    }

    const getProjectPath = (name: string) => projectFolder(name);

    const existsProject = (name: string) => fsExistsAsDirectory(getProjectPath(name))

    const createProject = async (name: string) => {
        console.trace(`createProject: ensureDir "${templatesFolder}/${name}"`)
        await fs.ensureDir(getProjectPath(name))
    };

    return {
        isInitialized,
        initialize,
        ensureInitialized,
        fetchTemplateInfo,
        fetchTemplatesInfo,

        getProjectPath,
        existsProject,
        createProject,
    }
}
