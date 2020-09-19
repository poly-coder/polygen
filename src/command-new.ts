// import commander from "commander";
// import { getOptions, PCGenProgramOptions } from "./common";
// import { getConsola } from "./logging";
// import { createGeneratorsSystem, RunGeneratorOptions } from "./gen-system";

// export interface NewCommandOptions extends PCGenProgramOptions, RunGeneratorOptions {
// }

// export function newCommand(command: commander.Command) {
//     command
//         .command("new")
//         .alias("n")
//         .description("Execute a generator")
//         .arguments("<generator> [name]")
//         .option('-m, --model <file>', 'File containing model data. This is a json/yaml/xml/toml/js file containing input model')
//         .option('-s, --step <names...>', 'Indicates that only the given steps must be executed')
//         .option('-j, --json-path <path>', 'JsonPath expression to access a submodel from the given model')
//         .option('-f, --model-format <format>', 'Indicates the model format', 'auto')
//         .option('-d, --dry-run', 'Dry run. Do not generate side effects. Only print messages as if code would have been actually generated', false)
//         .option('-w, --overwrite', 'Overwrite all generated files without asking')
//         .option('--no-overwrite', 'Never overwrite an existing file with a generated one. This excludes snippet insertion step')
//         .option('--phases <phase>', 'Last phase to run: none, validate, pregenerate, generate, postgenerate or all', 'all')
//         .option('-b, --backup <ext>', 'Create backup files before writing on a file, even for snippets and copy commands')
//         .action((generator: string, name: string, args) => executeNewCommand({
//             ...getOptions(args),
//             name,
//             generator,
//         }))
//     }
    
// async function executeNewCommand(opts: NewCommandOptions) {
//     const console = getConsola(opts);
//     const genSystem = createGeneratorsSystem(console);

//     if (!(await genSystem.ensureInitialized())) {
//         return;
//     }

//     await genSystem.runGenerator(opts)
// }
