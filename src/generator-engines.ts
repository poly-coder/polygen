import chalk from "chalk"
import { Consola } from "consola"
import ejs from "ejs";
import handlebars from "handlebars";
import { Liquid } from "liquidjs";
import mustache from "mustache";
import nunjucks from "nunjucks";
import pug from "pug";
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
            return ejs.render(template, context)
        }
    },
    {
        name: 'handlebars',
        extensions: ['.hbs', '.handlebars'],
        enumType: GeneratorEngineEnum.Handlebars,
        execute: async (template, context) => {
            const processor = handlebars.compile(template)
            return processor(context)
        }
    },
    {
        name: 'liquid',
        extensions: ['.liquid'],
        enumType: GeneratorEngineEnum.Liquid,
        execute: async (template, context) => {
            const engine = new Liquid()
            return await engine.parseAndRender(template, context)
        }
    },
    {
        name: 'mustache',
        extensions: ['.mustache'],
        enumType: GeneratorEngineEnum.Mustache,
        execute: async (template, context) => {
            return await mustache.render(template, context)
        }
    },
    {
        name: 'nunjucks',
        extensions: ['.njk', '.nunjucks'],
        enumType: GeneratorEngineEnum.Nunjucks,
        execute: async (template, context) => {
            return nunjucks.renderString(template, context)
        }
    },
    {
        name: 'pug',
        extensions: ['.pug'],
        enumType: GeneratorEngineEnum.Pug,
        execute: async (template, context) => {
            const engine = pug.compile(template)
            return await engine(context)
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
