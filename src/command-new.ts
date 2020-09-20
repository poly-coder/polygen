import commander from "commander";
import { getOptions, PCGenProgramOptions } from "./common";
import { getConsola } from "./logging";
import { createGeneratorsSystem } from "./gen-system";
import { readGeneratorSystemConfig } from "./gen-configuration";
import { RunGeneratorOptions } from "./gen-types";

export interface NewCommandOptions extends PCGenProgramOptions, RunGeneratorOptions {
}

export function newCommand(command: commander.Command) {
    command
        .command("new")
        .alias("n")
        .description("Execute a generator")
        .arguments("<generator> [name]")
        .option('-m, --model <file>', 'File containing model data. This is a json/yaml/xml/toml/js file containing input model')
        .option('-s, --step <names...>', 'Indicates that only the given steps must be executed')
        .option('-j, --json-path <path>', 'JsonPath expression to access a submodel from the given model')
        .option('-f, --model-format <format>', 'Indicates the model format', 'auto')
        .option('-d, --dry-run', 'Dry run. Do not generate side effects. Only print messages as if code would have been actually generated', false)
        .option('-w, --overwrite', 'Overwrite all generated files without asking. By default no existing file is overwritten')
        .option('--no-overwrite', 'Never overwrite an existing file with a generated one. This excludes snippet insertion step')
        .option('--phases <phase>', 'Last phase to run: none, validate, pregenerate, generate, postgenerate or all', 'all')
        .action((generator: string, name: string, args) => executeNewCommand({
            ...getOptions(args),
            name,
            generator,
        }))
    }
    
async function executeNewCommand(opts: NewCommandOptions) {
    const console = getConsola(opts);
    const config = await readGeneratorSystemConfig(console);
    const genSystem = createGeneratorsSystem(config, console);
  
    if (!(await genSystem.ensureInitialized())) {
      return;
    }
  
    await genSystem.runGenerator(opts)
}
