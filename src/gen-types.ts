import { Consola } from "consola";
import { CommandStep } from "./gen-steps";
import { TemplateEngine } from "./generator-engines";

export type Mutable<T> = {
    -readonly[P in keyof T]: T[P]
};

export type Variables = Readonly<Record<string, string | undefined>>

export interface GeneratorSystemConfig {
    /**
     * Paths where to locate generators
     */
    readonly searchPaths: readonly string[];
    /**
     * Paths where to locate local generators and create new ones. Created with pcgen init
     */
    readonly basePath: string;
    /**
     * pcgen folder where generators are located, relative to base path. Default: '_pcgen'
     */
    readonly pcgenFolder: string;
    /**
     * generator folder where init generator is located, relative to pcgen path. Default: 'generator'
     */
    readonly generatorFolder: string;
    /**
     * commands folder where commands are located, relative to generator folder. Default: 'commands'
     */
    readonly commandsFolder: string;
    /**
     * templates folder where templates are located, relative to generator folder. Default: 'templates'
     */
    readonly templatesFolder: string;
    /**
     * default command used when a generator is executed. Default: 'new'
     */
    readonly defaultCommand: string;
    /**
     * current working directory where new files are generated relative to it. Default: 'process.cwd()'
     */
    readonly cwd: string;
    /**
     * initAssets folder where initializer generator is located.
     */
    readonly initAssets: string;
}

export interface ListGeneratorsOptions {
    readonly name?: string;
}

export interface InitializeOptions {
    readonly searchPaths?: string;
    readonly basePath?: string;
    readonly pcgenFolder?: string;
    readonly generatorFolder?: string;
    readonly commandsFolder?: string;
    readonly templatesFolder?: string;
    readonly defaultCommand?: string;
    readonly cwd?: string;
    readonly initAssets?: string;
}

export interface RunGeneratorOptions {
    readonly name?: string;
    readonly generator: string;
    readonly step?: string;
    readonly model?: string;
    readonly jsonPath?: string;
    readonly modelFormat?: string;
    readonly phases?: string;
    readonly dryRun: boolean;
    readonly overwrite?: boolean;
    readonly stdout?: boolean;
}

export interface RunCommandResult {
    readonly steps: ReadonlyArray<CommandStep>;
}

export type RunCommandFunc = (context: RunCommandContext) => Promise<RunCommandResult | null>;

export interface CommandDescriptorData {
    readonly name: string;
    readonly js: string;
    readonly details?: any;
    readonly overwrite?: boolean;
    readonly requireName?: boolean;
    readonly requireModel?: boolean;
}

export interface CommandDescriptor {
    readonly data: CommandDescriptorData;
    readonly runCommand: RunCommandFunc;
    readonly generator: GeneratorDescriptor;
}

export interface GeneratorDescriptorData {
    readonly commands: ReadonlyArray<CommandDescriptorData>;
    readonly details?: any;
    readonly overwrite?: boolean;
    readonly outDir?: string;
    readonly engine?: string;
    readonly requireName?: boolean;
    readonly requireModel?: boolean;
}

export interface GeneratorDescriptor {
    readonly fullPath: string;
    readonly name: string;
    readonly commands: ReadonlyArray<CommandDescriptor>;
    readonly engine?: TemplateEngine;
    readonly engineOptions?: any;
    readonly data: GeneratorDescriptorData;
    readonly outDir: string;
}

export interface IGeneratorsSystem {
    readonly isInitialized: () => Promise<boolean>;
    readonly ensureInitialized: () => Promise<boolean>;
    readonly initialize: (options: InitializeOptions) => Promise<void>;

    readonly getGeneratorDescriptor: (name: string) => Promise<GeneratorDescriptor | undefined>;
    readonly listGenerators: (options: ListGeneratorsOptions) => Promise<string[]>;

    readonly runGenerator: (options: RunGeneratorOptions) => Promise<void>;
}

export interface RunCommandContext {
    /**
     * Parent context
     */
    readonly parent: RunCommandContext | null;
    /**
     * name parameter value
     */
    readonly name?: string;
    /**
     * Current model
     */
    readonly model?: any;
    /**
     * Helpers object
     * Typical helpers:
     * - env: Environment variables
     * - config: Configuration values and functions
     * - case: change case functions
     * - inflections: inflection functions
     * - humanize: humanize functions
     */
    readonly h: any;
    /**
     * Console
     */
    readonly console: Consola;
    /**
     * Generator System
     */
    readonly genSystem: IGeneratorsSystem;
    /**
     * Current generator descriptor
     */
    readonly generatorDescriptor: GeneratorDescriptor;
    /**
     * Current command descriptor
     */
    readonly commandDescriptor: CommandDescriptor;
    // /**
    //  * Current step descriptor
    //  */
    // readonly stepDescriptor: CommandStepDescriptor;
}

export interface GeneratorRuntime {
    readonly fileExists: (filePath: string) => Promise<boolean>;
    readonly readFile: (filePath: string) => Promise<string | undefined>;
    readonly writeFile: (filePath: string, content: string) => void;
    readonly execute: () => Promise<void>;
}
