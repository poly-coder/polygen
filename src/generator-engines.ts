import chalk from "chalk"
import { Consola } from "consola"
import ejs from "ejs";
import { tracedError } from "./logging"

export enum GeneratorEngineEnum {
    EJS,
    Handlebars,
    Liquid,
    Mustache,
    Nunjucks,
    Pug,
}

export interface GeneratorEngine {
    readonly name: string;
    readonly extensions: readonly string[];
    readonly enumType: GeneratorEngineEnum;
    readonly execute: (template: string, context: any) => Promise<string>
}

// TODO: Make this an extensibility point

const GENERATOR_ENGINES: GeneratorEngine[] = [
    {
        name: 'ejs',
        extensions: ['.ejs'],
        enumType: GeneratorEngineEnum.EJS,
        execute: executeEJSTemplate
    },
    {
        name: 'handlebars',
        extensions: ['.hbs', '.handlebars'],
        enumType: GeneratorEngineEnum.Handlebars,
        execute: async () => 'Not Implemented!!!!!'
    },
    {
        name: 'liquid',
        extensions: ['.liquid'],
        enumType: GeneratorEngineEnum.Liquid,
        execute: async () => 'Not Implemented!!!!!'
    },
    {
        name: 'mustache',
        extensions: ['.mustache'],
        enumType: GeneratorEngineEnum.Mustache,
        execute: async () => 'Not Implemented!!!!!'
    },
    {
        name: 'nunjucks',
        extensions: ['.njk', '.nunjucks'],
        enumType: GeneratorEngineEnum.Nunjucks,
        execute: async () => 'Not Implemented!!!!!'
    },
    {
        name: 'pug',
        extensions: ['.pug'],
        enumType: GeneratorEngineEnum.Pug,
        execute: async () => 'Not Implemented!!!!!'
    },
]

function getGeneratorNames() {
    return GENERATOR_ENGINES
        .map(e => chalk.greenBright(e.name))
        .join(', ')
}

export function findGeneratorEngine(generatorName: string | undefined, console: Consola): GeneratorEngine | undefined {
    if (!generatorName) {
        return undefined
    }

    const name = generatorName.toLowerCase()

    const engine = GENERATOR_ENGINES.find(e => e.name == name)

    if (engine) {
        return engine
    }

    throw tracedError(console, `Invalid generator engine: '${chalk.redBright(generatorName)}'. Use one of ${getGeneratorNames()}`)
}

async function executeEJSTemplate(template: string, context: any) {
    return ejs.render(template, context)
}
