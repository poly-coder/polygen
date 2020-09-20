
export interface CommonCommandStep {
    /**
     * Current step's name. Usefull to reference the step when running only some steps of a given generator
     */
    readonly stepName?: string;
    /**
     * If true, skip running this step for now. Useful for "commenting the step out temporarily"
     */
    readonly skip?: boolean;
}

export interface FileBasedCommandStep extends CommonCommandStep {
    /**
     * A path to the source file to be copied or used as a template
     */
    readonly from: string;
    /**
     * The path to the generated file. 
     */
    readonly to: string;
}

export interface CopyCommandStep extends FileBasedCommandStep {
    /**
     * Indicates that this is a verbatim file copy operation, no template engine is involved, 
     * hence no model or any fancy preprocessing is involved.
     */
    readonly type: "copy";
    /**
     * If not indicated globally, indicates that this step must overwrite or not the destination file
     */
    readonly overwrite?: boolean;
}

export interface TemplateBasedCommandStep extends FileBasedCommandStep {
    /**
     * Indicates the template engine to be used
     */
    readonly engine?: string;
    /**
     * If a string, it indicates a file which content must be loaded as the model. Path based on CWD
     * If an object, it represents the model itself
     * If undefined, the model from the context is used, if any
     * This model is preprocessed with jsonPath before passing it to the template engine
     */
    readonly model?: any | string;
    /**
     * Instead of guessing the model file format, you can indicate the right choice
     */
    readonly modelFormat?: string;
    /**
     * Indicates a JSON Path expression to preprocess the input model to be passed to the template
     */
    readonly jsonPath?: string;
}

export interface FileCommandStep extends TemplateBasedCommandStep {
    /**
     * Indicates that this is a template operation where a new whole file is generated
     */
    readonly type: "file";
    /**
     * If not indicated globally, indicates that this step must overwrite or not the destination file
     */
    readonly overwrite?: boolean;
}

export interface SnippetCommandStep extends TemplateBasedCommandStep {
    /**
     * Indicates that this is a template operation where a snippet is generated and inserted into a region of another file
     */
    readonly type: "snippet";
    /**
     * A text to indicate the start line where the generated content must be inserted
     */
    readonly start: string;
    /**
     * A text to indicate the end line where the generated content must be inserted
     */
    readonly end: string;
    /**
     * A RegExp to indicate the start line where the generated content must be inserted
     */
    readonly startRegExp: string;
    /**
     * A RegExp to indicate the end line where the generated content must be inserted
     */
    readonly endRegExp: string;
}

export interface GeneratorCommandStep extends CommonCommandStep {
    /**
     * Indicates that this is a call to another generator/command/steps
     */
    readonly type: "generator";
    /**
     * The generator name. If left blank, the same generator that is invoking is used.
     */
    readonly generator?: string;
    /**
     * The name parameter, as when the CLI command is used like 'pcgen new <generator> <name>'. 
     * If not indicated, the default command new is used
     */
    readonly name?: string;
    /**
     * The step(s) to be used when generating. If left blank, all steps are run
     */
    readonly step?: string;
    /**
     * The model to use when invoking the generator's command. 
     * If it is a string, then file '%CWD%/model' is loaded using given modelFormat
     * If an object is given, thei it is used as the model itself
     * If left blank, then the current model is used
     */
    readonly model?: string | any;
    /**
     * Instead of guessing the model file format, you can indicate the right choice
     */
    readonly modelFormat?: string;
    /**
     * Indicates a JSON Path expression to preprocess the input model to be passed to the template
     */
    readonly jsonPath?: string;
    /**
     * Indicates which phases to run. It cannot be a more advanced phase than the current one.
     * If left blank, the current phase is used
     */
    readonly phases?: string;
    /**
     * Inicates if only a dry run must be performed. If current execution is already dry, this value is inconsecuential
     */
    readonly dryRun: boolean;
    /**
     * Indicates the default overwrite mode. It cannot override the current overwrite setting
     */
    readonly overwrite?: boolean;
}

export type CommandStep = CopyCommandStep | FileCommandStep | SnippetCommandStep | GeneratorCommandStep
