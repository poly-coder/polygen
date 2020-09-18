import path from 'path';
import fs from 'fs-extra';
import { Consola } from 'consola';
import chalk from 'chalk';
import { fsExistsAsDirectory, fsExistsAsFile, fsReadFileContent } from './file-utils';

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
    readonly commands: boolean;
}

export type GeneratorEngine = "ejs" | "handlebars" | "liquid" | "mustache" | "nunjucks" | "pug" | "copy";

export interface TemplateCommandStep {
    readonly type: "template";
    readonly to: string;
    readonly from: string;
    readonly engine?: GeneratorEngine;
}

export type CommandStep = TemplateCommandStep;

export interface RunCommandResult {
    readonly steps: ReadonlyArray<CommandStep>;
}

export interface RunCommandContext {
    readonly model: any;
    readonly console: Consola;
    readonly templates: ITemplateSystem;
}

export type RunCommandFunc = (model: any, context: RunCommandContext) => Promise<RunCommandResult | null>;

export interface CommandDescriptor {
    readonly name: string;
    readonly js: string;
    readonly details?: any;

    runCommand: RunCommandFunc;
}

export interface GeneratorProjectDescriptor {
    readonly details?: any;
    readonly outDir?: string;
    readonly engine?: GeneratorEngine;
    readonly commands: ReadonlyArray<CommandDescriptor>;
}

export interface TemplateInfo {
    readonly name: string;
    readonly details?: any;
    readonly engine?: any;
    readonly commands?: ReadonlyArray<CommandDescriptor>;
    
    readonly projectInfo?: GeneratorProjectDescriptor;
}

export function createTemplateSystem(console: Consola): ITemplateSystem {
    // TODO: Define POLYGEN_PROJECTS env var
    // TODO: Define polygen.json for configuration
    // TODO: Look for parent folders when not found?
    
    const polygenFolder = '_polygen'
    const generatorFolder = 'generator'
    const commandsSubFolder = 'commands'
    const templatesSubFolder = 'templates'
    
    const fullPath = (relativePath: string) => path.join(process.cwd(), relativePath)
    const projectFullPath = (project: string) => fullPath(path.join(polygenFolder, project))
    const itemFullPath = (project: string, relativePath: string) => fullPath(path.join(polygenFolder, project, relativePath))
    
    const polygenBasePath = fullPath(polygenFolder)
    // const defaultCommand = 'new'
    const generatorAssets = path.join(__dirname, '../assets/generator') 

    // const projectCommandPath = (project: string, commandName: string) => path.join(projectFolder(project), commandsSubFolder, `${commandName}.js`)
    // const projectTemplatePath = (project: string, templateName: string) => path.join(projectFolder(project), templatesSubFolder, templateName)

    const globalVariables: Record<string, string> = {
        'CWD': process.cwd(),                       // Current Working Directory
        'PWD': process.cwd(),                       // Process Working Directory, same as CWD
        
        'POLYGEN_FOLDER': polygenFolder,            // _polygen
        'GENERATORS_FOLDER': generatorFolder,       // generators
        'COMMANDS_FOLDER': commandsSubFolder,       // commands
        'TEMPLATES_FOLDER': templatesSubFolder,     // templates

        'POLYGEN_PATH': polygenFolder,                  // _polygen
        'POLYGEN_FULLPATH': fullPath(polygenFolder),    // %CWD%/_polygen

        'GENERATORS_PATH': path.join(polygenFolder, generatorFolder),   // _polygen/generators
        'GENERATORS_FULLPATH': projectFullPath(generatorFolder),          // %CWD%/_polygen/generators
    }

    const getLocalVariables = (projectName: string): Record<string, string> => {
        const commandsPath = path.join(polygenFolder, projectName, commandsSubFolder)
        const templatesPath = path.join(polygenFolder, projectName, templatesSubFolder)

        return {
            'PROJECT_NAME': projectName,
            
            'COMMANDS_PATH': commandsPath,                  // _polygen/%PROJECT_NAME%/commands
            'COMMANDS_FULLPATH': fullPath(commandsPath),    // %CWD%/_polygen/commands
            
            'TEMPLATES_PATH': templatesPath,                // _polygen/templates
            'TEMPLATES_FULLPATH': fullPath(templatesPath),  // %CWD%/_polygen/templates
        }
    }

    const replaceVariables = (projectName: string, text: string): string => {
        return text.replace(/%([A-Za-z_][A-Za-z_0-9]*)%/, (substring: string, varName: string): string => {
            return globalVariables[varName] ??
                getLocalVariables(projectName)[varName] ??
                process.env[varName] ??
                substring
        })
    }

    const isInitialized = () => fsExistsAsDirectory(polygenBasePath)

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
            fs.copy(generatorAssets, projectFullPath(generatorFolder))
        }
    }

    const ensureProjectDesc = async (projectName: string, projDesc: GeneratorProjectDescriptor | undefined): Promise<GeneratorProjectDescriptor> => {
        if (projDesc) {
            return projDesc;
        }

        const jsonPath = itemFullPath(projectName, `${projectName}.json`)
        const jsonContent = await fsReadFileContent(jsonPath)
        if (jsonContent) {
            try {
                projDesc = JSON.parse(replaceVariables(projectName, jsonContent)) as GeneratorProjectDescriptor;
                console.trace('Read project descriptor from ', jsonPath)
                return projDesc;
            } catch (error) {
                console.trace('Error reading project descriptor from ', jsonPath)
            }
        } else {
            console.trace('Project descriptor not found at ', jsonPath)
        }

        // Search commands in commands folder
        const commands: CommandDescriptor[] = [];

        const fileNames = await fs.readdir(itemFullPath(projectName, commandsSubFolder))

        for (const fileName of fileNames) {
            if (await fsExistsAsFile(fileName)) {
                const jsFileName = `${fileName}.js`;

                const runCommand = async (model: any, context: RunCommandContext) => {
                    const cmdModule = await import(path.join(`./${polygenFolder}`, projectName, commandsSubFolder, jsFileName))

                    console.trace('Loaded module: ', cmdModule);
                    
                    if (typeof cmdModule == 'function') {
                        const result: RunCommandResult = await cmdModule(model, context)

                        // TODO: Validate result
                        
                        return result
                    }
                    
                    console.trace('Loaded module: ', cmdModule);
                    return null;
                }

                const cmd: CommandDescriptor = {
                    name: fileName,
                    js: `${fileName}.js`,
                    runCommand,
                }
    
                commands.push(cmd);
            }
        }

        return {
            commands,
        }
    }

    const fetchTemplateInfo = async (name: string, options: FetchTemplateInfoOptions) => {
        const folder = projectFullPath(name)
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

            if (options.commands) {
                projDesc = await ensureProjectDesc(name, projDesc)
                info.commands = projDesc?.commands
            }

            return info as TemplateInfo;
        }
        
        return null
    }

    const fetchTemplatesInfo = async (options: FetchTemplateInfoOptions) => {
        const files = await fs.readdir(polygenBasePath)
        const infos: TemplateInfo[] = []
        
        console.trace(`Searching generator projects at ${polygenBasePath}`)
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

    const getProjectPath = (name: string) => projectFullPath(name);

    const existsProject = (name: string) => fsExistsAsDirectory(getProjectPath(name))

    const createProject = async (name: string) => {
        console.trace(`createProject: ensureDir "${polygenFolder}/${name}"`)
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
