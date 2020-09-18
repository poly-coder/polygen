import chalk from "chalk";
import commander from "commander";
import { capitalCase } from "change-case";
import { Consola } from "consola";
import { getOptions, PCGenProgramOptions } from "./common";
import { getConsola } from "./logging";
import { createGeneratorsSystem, FetchGeneratorInfoOptions, GeneratorInfo } from "./gen-system";

export interface InfoCommandOptions extends PCGenProgramOptions, FetchGeneratorInfoOptions {
    readonly project: string;
}

export function infoCommand(command: commander.Command) {
    command
        .command("info")
        .description("Show detailed information of a generator project")
        .arguments("<project>")
        .option('-d, --details', 'Show generator details', true)
        .option('--no-details', 'Hide generator details')
        .option('-c, --commands', 'Show generator commands', true)
        .option('--no-commands', 'Hide generator commands')
        .action((project: string, args) => executeListCommand({
            ...getOptions(args),
            project,
        }))
    }
    
async function executeListCommand(opts: InfoCommandOptions) {
    const console = getConsola(opts);
    const genSystem = createGeneratorsSystem(console);

    if (!(await genSystem.ensureInitialized())) {
        return;
    }

    var info = await genSystem.fetchGeneratorInfo(opts.project, opts)
    
    if (info) {
        printGeneratorInfo(info, console)
    } else {
        console.warn(`Generator project "${opts.project}" does not exists`)
    }
}

function printField(key: string, value: any, indent: string = '') {
    if (value == null || value == undefined) {
        return
    }
    if ((key + value).length > 40) {
        console.log(`${indent}    ${chalk.white(key)}:`)
        console.log(`${indent}        ${chalk.gray(value)}`)
    } else {
        console.log(`${indent}    ${chalk.white(key)}: ${chalk.gray(value)}`)
    }
}

function printDetails(details?: any, indent: string = '') {
    if (details) {
        for (const [key, value] of Object.entries(details)) {
            printField(capitalCase(key), value, indent);
        }
    }
}

export function printGeneratorInfo(info: GeneratorInfo, console: Consola) {
    console.log(`- ${chalk.greenBright(info.name)}`)
    
    printField('Engine', info.engine);
    printField('Output Directory', info.outDir);
    printDetails(info.details)

    if (info.commands) {
        if (info.commands.length > 0) {
            printField('Commands', '')
            for (const command of info.commands) {
                console.log(`    > ${chalk.cyanBright(command.name)}`)
                printField('Code File', command.js, '    ');
                printDetails(command.details, '    ')
            }
        } else {
            printField('Commands', 'none')
        }
    }
}
