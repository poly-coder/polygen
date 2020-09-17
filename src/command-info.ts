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
        .action((project: string, args) => executeListCommand({
            ...getOptions(args),
            project,
        }))
    }
    
async function executeListCommand(opts: InfoCommandOptions) {
    const console = getConsola(opts);
    const templates = createTemplateSystem(console);

    console.log('opts', opts)

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

function printField(key: string, value: any) {
    if ((key + value).length > 40) {
        console.log(`  ${chalk.white(key)}`)
        console.log(`    ${chalk.gray(value)}`)
    } else {
        console.log(`  ${chalk.white(key)}: ${chalk.gray(value)}`)
    }
}

export function printTemplateInfo(info: TemplateInfo, console: Consola) {
    console.log(`- ${chalk.greenBright(info.name)}`)
    
    if (info.engine) {
        printField('Engine', info.engine);
    }
    
    if (info.details) {
        for (const [key, value] of Object.entries(info.details)) {
            printField(capitalCase(key), value);
        }
    }
}