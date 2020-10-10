/**
 * Default function receives the following arguments as a single context parameter
 * - name: string; is the name send by the CLI when doing 'pcgen new <%= name %> <name> [options]'
 * - model: any; is the model indicated by pcgen option --model
 * - h: any; is the helpers container, typically env, case, inflections and humanize
 * - console: Consola; See npm package Consola for documentation
 * - vars: Variables related to current execution: GENERATOR_NAME, GENERATOR_FOLDER, OUT_DIR, ...
 * - options: Object containing CLI options. 
 * - configuration: Configuration object. 
 * Function can return a Promise or use async modifier
 * Steps can be of type 'file', 'snippet', 'copy' or 'generator'
 */
module.exports = async function ({ name, configuration }) {
  return {
    steps: [
      {
        type: 'file',
        from: 'generator.ejs',
        to: `${name}/${name}.json`,
      },
      {
        type: 'file',
        from: 'new.ejs',
        to: `${name}/${configuration.commandsFolder}/${configuration.defaultCommand}.js`,
      },
      {
        type: 'file',
        from: 'sample.ejs',
        to: `${name}/${configuration.templatesFolder}/sample.ejs`,
      },
    ],
  };
};
