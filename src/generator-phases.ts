import chalk from "chalk"
import { Consola } from "consola"
import { tracedError } from "./logging"

export enum GeneratorPhaseEnum {
    None = -Infinity,
    Validate = 1, 
    PreGenerate = 2, 
    Generate = 3,
    PostGenerate = 4,
    All = +Infinity
}

export interface GeneratorPhase {
    readonly name: string;
    readonly enumType: GeneratorPhaseEnum;
}

// TODO: Make this an extensibility point

const GENERATOR_PHASES: GeneratorPhase[] = [
    {
        name: 'none',
        enumType: GeneratorPhaseEnum.None,
    },
    {
        name: 'validate',
        enumType: GeneratorPhaseEnum.Validate,
    },
    {
        name: 'pregenerate',
        enumType: GeneratorPhaseEnum.PreGenerate,
    },
    {
        name: 'generate',
        enumType: GeneratorPhaseEnum.Generate,
    },
    {
        name: 'postgenerate',
        enumType: GeneratorPhaseEnum.PostGenerate,
    },
    {
        name: 'all',
        enumType: GeneratorPhaseEnum.All,
    },
]

function getPhaseNames() {
    return GENERATOR_PHASES
        .map(e => chalk.greenBright(e.name))
        .join(', ')
}

export function findGeneratorPhase(phaseName: string | undefined, console: Consola): GeneratorPhaseEnum | undefined {
    if (!phaseName) {
        return undefined
    }

    const name = phaseName.toLowerCase()

    const phase = GENERATOR_PHASES.find(e => e.name == name)

    if (phase) {
        return phase.enumType
    }

    throw tracedError(console, `Invalid generator phase: '${chalk.redBright(phaseName)}'. Use one of ${getPhaseNames()}`)
}
