import chalk from "chalk";
import commander from "commander";
import { capitalCase } from "change-case";
import { Consola } from "consola";
import { getOptions, PolyGenProgramOptions } from "./common";
import { getConsola } from "./logging";
import { createTemplateSystem, FetchTemplateInfoOptions, TemplateInfo } from "./templates";

export interface InfoCommandOptions extends PolyGenProgramOptions, FetchTemplateInfoOptions {
    readonly project: string;
}

export function infoCommand(command: commander.Command) {
    command
        .command("info")
        .description("Show detailed information of a generator project")
        .arguments("<project>")
        // .requiredOption('-p, --project <value>', 'Generator name. Must be compatible with the file system.')
        .requiredOption('-d, --details', 'Show generator details', true)
        .requiredOption('--no-details', 'Hide generator details')
        .requiredOption('-c, --commands', 'Show generator commands', true)
        .requiredOption('--no-commands', 'Hide generator commands')
        .action((project: string, args) => executeListCommand({
            ...getOptions(args),
            project,
        }))
    }
    
async function executeListCommand(opts: InfoCommandOptions) {
    const console = getConsola(opts);
    const templates = createTemplateSystem(console);

    if (!(await templates.ensureInitialized())) {
        return;
    }

    var info = await templates.fetchTemplateInfo(opts.project, opts)
    
    if (info) {
        printTemplateInfo(info, console)
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

export function printTemplateInfo(info: TemplateInfo, console: Consola) {
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
