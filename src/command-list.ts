import commander from "commander";
import { printTemplateInfo } from "./command-info";
import { getOptions, PolyGenProgramOptions } from "./common";
import { getConsola } from "./logging";
import { createTemplateSystem, FetchTemplateInfoOptions } from "./templates";

export interface ListCommandOptions extends PolyGenProgramOptions, FetchTemplateInfoOptions {
}

export function listCommand(command: commander.Command) {
    command
        .command("list")
        .alias('ls')
        .description("List existing generators and commands")
        .requiredOption('-d, --details', 'Show generator details', false)
        .action(args => executeListCommand(getOptions(args)))
    }
    
async function executeListCommand(opts: ListCommandOptions) {
    const console = getConsola(opts);
    const templates = createTemplateSystem(console);

    if (!(await templates.ensureInitialized())) {
        return;
    }

    var infos = await templates.fetchTemplatesInfo(opts)

    for (const info of infos) {
        printTemplateInfo(info, console)
    }
}
