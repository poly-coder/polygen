import chalk from "chalk"
import { Consola } from "consola"
import { tracedError } from "./utils"

export enum ModelFormatEnum {
    Module, 
    Json,
    Xml,
    Toml,
    Ini
}

export interface ModelFormat {
    readonly name: string;
    readonly extensions: readonly string[];
    readonly enumType: ModelFormatEnum;
}

// TODO: Make this an extensibility point

const MODEL_FORMATS: ModelFormat[] = [
    {
        name: 'module',
        extensions: ['.js'],
        enumType: ModelFormatEnum.Module,
    },
    {
        name: 'json',
        extensions: ['.json'],
        enumType: ModelFormatEnum.Json,
    },
    {
        name: 'xml',
        extensions: ['.xml'],
        enumType: ModelFormatEnum.Xml,
    },
    {
        name: 'toml',
        extensions: ['.toml'],
        enumType: ModelFormatEnum.Toml,
    },
    {
        name: 'ini',
        extensions: ['.ini'],
        enumType: ModelFormatEnum.Ini,
    },
]

function getModelFormats() {
    return MODEL_FORMATS
        .map(e => chalk.greenBright(e.name))
        .join(', ')
}

export function findModelFormat(modelFormat: string | undefined, console: Consola): ModelFormat | undefined {
    if (!modelFormat) {
        return undefined
    }

    const name = modelFormat.toLowerCase()

    const engine = MODEL_FORMATS.find(e => e.name == name)

    if (engine) {
        return engine
    }

    throw tracedError(console, `Invalid model: '${chalk.redBright(modelFormat)}'. Use one of ${getModelFormats()}`)
}
