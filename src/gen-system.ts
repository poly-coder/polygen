import path from 'path';
import fs from 'fs-extra';
import { Consola } from 'consola';
import chalk from 'chalk';
import { fsExistsAsDirectory, fsExistsAsFile, fsReadFileContent } from './file-utils';

type Mutable<T> = {
    -readonly[P in keyof T]: T[P]
};

export interface IGeneratorsSystem {
    readonly isInitialized: () => Promise<boolean>;
    readonly ensureInitialized: () => Promise<boolean>;
    readonly initialize: () => Promise<void>;

    readonly fetchGeneratorInfo: (name: string, options: FetchGeneratorInfoOptions) => Promise<GeneratorInfo | null>;
    readonly fetchGeneratorsInfo: (options: FetchGeneratorInfoOptions) => Promise<GeneratorInfo[]>;

    readonly runGenerator: (opts: RunGeneratorOptions) => Promise<void>;
}

export interface FetchGeneratorInfoOptions {
    readonly details: boolean;
    readonly commands: boolean;
}

export interface RunGeneratorOptions {
    readonly name?: string;
    readonly generator: string;
    readonly step?: string;
    readonly model: string;
    readonly jsonPath: string;
    readonly modelFormat: string;
    readonly phases: string;
    readonly dryRun: boolean;
}

export type GeneratorEngine = "ejs" | "handlebars" | "liquid" | "mustache" | "nunjucks" | "pug" | "copy";

export interface CommonCommandStep {
    readonly skip?: boolean;
}

export interface TemplateCommandStep extends CommonCommandStep {
    readonly type: "template";
    readonly to: string;
    readonly from: string;
    readonly engine?: GeneratorEngine;
    readonly jsonPath?: string;
    readonly model?: any;
}

export type CommandStep = TemplateCommandStep;

export interface RunCommandResult {
    readonly steps: ReadonlyArray<CommandStep>;
}

export interface RunCommandContext {
    readonly name?: string;
    readonly model?: any;
    readonly console: Consola;
    readonly genSystem: IGeneratorsSystem;
    readonly generatorDescriptor: GeneratorDescriptor;
    readonly commandDescriptor: CommandDescriptor;
    readonly env: Record<string, string | undefined>;
}

export type RunCommandFunc = (context: RunCommandContext) => Promise<RunCommandResult | null>;

export interface CommandDescriptor {
    readonly name: string;
    readonly js: string;
    readonly details?: any;

    runCommand: RunCommandFunc;
}

export interface GeneratorDescriptor {
    readonly details?: any;
    readonly outDir?: string;
    readonly engine?: GeneratorEngine;
    readonly commands: ReadonlyArray<CommandDescriptor>;
}

export interface GeneratorInfo {
    readonly name: string;
    readonly details?: any;
    readonly outDir?: string;
    readonly engine?: any;
    readonly commands?: ReadonlyArray<CommandDescriptor>;
    
    readonly generatorDescriptor?: GeneratorDescriptor;
}

export function createGeneratorsSystem(console: Consola): IGeneratorsSystem {
    // TODO: Define PCGEN_GENERATORS_HOME env var. Multiple sources?
    // TODO: Define pcgen.json for configuration
    // TODO: Look for parent folders when not found?
    
    const pcgenFolder = '_pcgen'
    const generatorFolder = 'generator'
    const commandsSubFolder = 'commands'
    const templatesSubFolder = 'templates'
    const defaultGeneratorCommand = 'new'
    
    const fullPath = (relativePath: string) => path.join(process.cwd(), relativePath)
    const generatorPath = (generatorName: string) => path.join(pcgenFolder, generatorName)
    const generatorFullPath = (generatorName: string) => fullPath(generatorPath(generatorName))
    const itemPath = (generatorName: string, relativePath: string) => path.join(pcgenFolder, generatorName, relativePath)
    const itemFullPath = (generatorName: string, relativePath: string) => fullPath(itemPath(generatorName, relativePath))
    const commandPath = (generatorName: string, commandName: string) => itemPath(generatorName, path.join(commandsSubFolder, `${commandName}.js`))
    // const commandFullPath = (generatorName: string, commandName: string) => fullPath(commandPath(generatorName, commandName))
    
    const pcgenBasePath = fullPath(pcgenFolder)
    const generatorAssets = path.join(__dirname, '../assets/generator') 

    const globalVariables: Record<string, string> = {
        'CWD': process.cwd(),                       // Current Working Directory
        'PWD': process.cwd(),                       // Process Working Directory, same as CWD
        
        'PCGEN_FOLDER': pcgenFolder,                // _pcgen
        'GENERATOR_FOLDER': generatorFolder,        // generator
        'COMMANDS_FOLDER': commandsSubFolder,       // commands
        'TEMPLATES_FOLDER': templatesSubFolder,     // templates

        'PCGEN_PATH': pcgenFolder,                  // _pcgen
        'PCGEN_FULLPATH': fullPath(pcgenFolder),    // %CWD%/_pcgen

        'GENERATOR_PATH': path.join(pcgenFolder, generatorFolder),   // _pcgen/generators
        'GENERATOR_FULLPATH': generatorFullPath(generatorFolder),          // %CWD%/_pcgen/generators
    }

    const getLocalVariables = (generatorName: string): Record<string, string> => {
        const commandsPath = path.join(pcgenFolder, generatorName, commandsSubFolder)
        const templatesPath = path.join(pcgenFolder, generatorName, templatesSubFolder)

        return {
            'GENERATOR_NAME': generatorName,
            
            'COMMANDS_PATH': commandsPath,                  // _pcgen/%GENERATOR_NAME%/commands
            'COMMANDS_FULLPATH': fullPath(commandsPath),    // %CWD%/_pcgen/%GENERATOR_NAME%/commands
            
            'TEMPLATES_PATH': templatesPath,                // _pcgen/%GENERATOR_NAME%/templates
            'TEMPLATES_FULLPATH': fullPath(templatesPath),  // %CWD%/_pcgen/%GENERATOR_NAME%/templates
        }
    }

    const createEnvVariables = (generatorName: string) => {
        return {
            ...process.env,
            ...globalVariables,
            ...getLocalVariables(generatorName),
        }
    }

    const replaceVariables = (generatorName: string, text: string): string => {
        return text.replace(/%([A-Za-z_][A-Za-z_0-9]*)%/, (substring: string, varName: string): string => {
            return globalVariables[varName] ??
                getLocalVariables(generatorName)[varName] ??
                process.env[varName] ??
                substring
        })
    }

    const isInitialized = () => fsExistsAsDirectory(pcgenBasePath)

    const ensureInitialized = async () => {
        if (!(await isInitialized())) {
            console.info('You must use command ', chalk.greenBright("'pcgen init'"), ' before start using pcgen')
            return false;
        }
        return true;
    }

    const initialize = async () => {
        if (!(await isInitialized())) {
            console.trace('Initializing pcgen ...')
            fs.copy(generatorAssets, generatorFullPath(generatorFolder))
        }
    }

    const createRunCommand = (generatorName: string, jsFileName: string) => {
        const runCommand = async (context: RunCommandContext) => {
            const modulePath = path.join(process.cwd(), pcgenFolder, generatorName, commandsSubFolder, jsFileName)

            console.trace(`Loading module ${jsFileName} at: `, modulePath);

            // const cmdModule = await import(modulePath)
            const cmdModule = await import(modulePath)

            if (typeof cmdModule?.default?.run !== 'function') {
                console.error(`Module '${modulePath}' does not exports function ${chalk.redBright('run(context)')}`)
                return null
            }

            const runFunc: RunCommandFunc = cmdModule.default.run

            const result: RunCommandResult | null = await runFunc(context)

            // TODO: Validate result

            return result
        }

        return runCommand
    }

    const ensureGeneratorDescriptor = async (generatorName: string, generatorDescriptor: GeneratorDescriptor | undefined): Promise<GeneratorDescriptor> => {
        if (generatorDescriptor) {
            return generatorDescriptor;
        }

        const jsonPath = itemFullPath(generatorName, `${generatorName}.json`)
        const jsonContent = await fsReadFileContent(jsonPath)
        if (jsonContent) {
            try {
                generatorDescriptor = JSON.parse(replaceVariables(generatorName, jsonContent)) as GeneratorDescriptor;
                console.trace('Read generator descriptor from ', jsonPath)

                for (const command of generatorDescriptor.commands) {
                    const runCommand = createRunCommand(generatorName, command.js)
                    
                    command.runCommand = runCommand
                }

                return generatorDescriptor;
            } catch (error) {
                console.trace('Error reading generator descriptor from ', jsonPath)
            }
        } else {
            console.trace('Generator descriptor not found at ', jsonPath)
        }

        // Search commands in commands folder
        const commands: CommandDescriptor[] = [];

        const fileNames = await fs.readdir(itemFullPath(generatorName, commandsSubFolder))

        for (const fileName of fileNames) {
            if (await fsExistsAsFile(fileName)) {
                const jsFileName = `${fileName}.js`;

                const runCommand = createRunCommand(generatorName, jsFileName)

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

    const fetchGeneratorInfo = async (name: string, options: FetchGeneratorInfoOptions) => {
        const folder = generatorFullPath(name)
        const info: Mutable<GeneratorInfo> = {
            name,
        }
        let projDesc: GeneratorDescriptor | undefined;

        if (await fsExistsAsDirectory(folder)) {
            if (options.details) {
                projDesc = await ensureGeneratorDescriptor(name, projDesc)
                info.engine = projDesc?.engine
                info.outDir = projDesc?.outDir
                info.details = projDesc?.details
            }

            if (options.commands) {
                projDesc = await ensureGeneratorDescriptor(name, projDesc)
                info.commands = projDesc?.commands
            }

            return info as GeneratorInfo;
        }
        
        return null
    }

    const fetchGeneratorsInfo = async (options: FetchGeneratorInfoOptions) => {
        const files = await fs.readdir(pcgenBasePath)
        const infos: GeneratorInfo[] = []
        
        console.trace(`Searching generators at ${pcgenBasePath}`)
        for (const name of files) {
            const info = await fetchGeneratorInfo(name, options)
            if (!!info) {
                console.trace(`Found generator "${name}"`)
    
                infos.push(info)
            } else {
                console.trace(`Found invalid generator file ${name}`)
            }
        }

        return infos;
    }

    const processGenerator = async (context: RunCommandContext, _opts: RunGeneratorOptions) => {
        // console.log('context', context)

        var runResult = await context.commandDescriptor.runCommand(context)

        console.log('runResult', runResult)
    }

    const runGenerator = async (opts: RunGeneratorOptions) => {
        
        const name = opts.name ?? defaultGeneratorCommand

        // TODO: Optimize loading only the given command, instead of the entire generator
        const generatorDescriptor = await ensureGeneratorDescriptor(opts.generator, undefined)

        if (!generatorDescriptor) {
            console.error(`Generator '${chalk.redBright(opts.generator)}' does not exists. Run '${chalk.greenBright(`pcgen new generator {opts.generator}`)}' to create it.`)
            return;
        }

        var commandDescriptor = generatorDescriptor.commands.find(c => c.name == name);

        if (!commandDescriptor) {
            console.error(`Command '${chalk.redBright(name)}' does not exists in generator '${chalk.greenBright(opts.generator)}'. Create file '${chalk.greenBright(commandPath(opts.generator, name))}' to enable it`)
            return;
        }
        
        const context: RunCommandContext = {
            console,
            env: createEnvVariables(opts.generator),
            genSystem,
            name: name,
            generatorDescriptor,
            commandDescriptor,
        }

        await processGenerator(context, opts)
    }

    const genSystem : IGeneratorsSystem = {
        isInitialized,
        initialize,
        ensureInitialized,
        fetchGeneratorInfo,
        fetchGeneratorsInfo,
        runGenerator,
    }

    return genSystem
}
