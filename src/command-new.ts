import commander from "commander";
import { getOptions, PCGenProgramOptions } from "./common";
import { getConsola } from "./logging";
import { createTemplateSystem, RunTemplateOptions } from "./templates";

export interface NewCommandOptions extends PCGenProgramOptions, RunTemplateOptions {
}

export function newCommand(command: commander.Command) {
    command
        .command("new")
        .alias("n")
        .description("Execute a generator")
        .arguments("<project> [name]")
        .option('-m, --model <file>', 'File containing model data. This is a json/yaml/xml/pom/toml file containing input model')
        .option('-p, --json-path <path>', 'JsonPath expression to access a submodel from the given model', '$')
        .option('-f, --model-format <format>', 'Indicates the model format', 'auto')
        .option('-d, --dry-run', 'Dry run. Do not generate side effects. Only print messages as if code would have been actually generated', false)
        .option('--phases <phase>', 'Last phase to run: none, validate, model, generate, transform or all', 'all')
        .action((project: string, name: string, args) => executeNewCommand({
            ...getOptions(args),
            name,
            project,
        }))
    }
    
async function executeNewCommand(opts: NewCommandOptions) {
    const console = getConsola(opts);
    const templates = createTemplateSystem(console);

    if (!(await templates.ensureInitialized())) {
        return;
    }

    console.log(`opts`, opts)
}
