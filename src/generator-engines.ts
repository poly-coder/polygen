import chalk from "chalk"
import { Consola } from "consola"
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
        execute: async (template, context) => {
            const ejs = await import('ejs')
            return ejs.render(template, context)
        }
    },
    {
        name: 'handlebars',
        extensions: ['.hbs', '.handlebars'],
        enumType: GeneratorEngineEnum.Handlebars,
        execute: async (template, context) => {
            const handlebars = await import('handlebars')
            const compiled = handlebars.compile(template)
            return compiled(context)
        }
    },
    {
        name: 'liquid',
        extensions: ['.liquid'],
        enumType: GeneratorEngineEnum.Liquid,
        execute: async (template, context) => {
            const liquidjs = await import('liquidjs')
            const engine = new liquidjs.Liquid()
            return await engine.parseAndRender(template, context)
        }
    },
    {
        name: 'mustache',
        extensions: ['.mustache'],
        enumType: GeneratorEngineEnum.Mustache,
        execute: async (template, context) => {
            const mustache = await import('mustache')
            return mustache.render(template, context)
        }
    },
    {
        name: 'nunjucks',
        extensions: ['.njk', '.nunjucks'],
        enumType: GeneratorEngineEnum.Nunjucks,
        execute: async (template, context) => {
            const nunjucks = await import('nunjucks')
            return nunjucks.renderString(template, context)
        }
    },
    {
        name: 'pug',
        extensions: ['.pug'],
        enumType: GeneratorEngineEnum.Pug,
        execute: async (template, context) => {
            const pug = await import('pug')
            const compiled = pug.compile(template)
            return compiled(context)
        }
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
