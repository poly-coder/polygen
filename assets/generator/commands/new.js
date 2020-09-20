module.exports = {
    /**
     * Run function receives the foolowing arguments as a single parameter
     * - name: string; is the name send by the CLI when doing 'pcgen new <%= name %> <name> [options]'
     * - model: any; is the model indicated by pcgen option --model
     * - h: any; is the helpers container, typically env, config, case, inflections and humanize
     * - console: Consola; See npm package Consola for documentation
     * - genSystem; references the generator system. Do not use unless you know what you are doing
     * - generatorDescriptor; Describes the current generator. Do not use unless you know what you are doing
     * - commandDescriptor; Describes the current command. Do not use unless you know what you are doing
     */
    run: function({name, h}) {
        return {
            steps: [
                {
                    type: "file",
                    from: "generator.ejs",
                    to: `${name}/${name}.json`,
                },
                {
                    type: "file",
                    from: "new.ejs",
                    to: `${name}/${h.config.commandsFolder}/${h.config.defaultCommand}.js`,
                },
                {
                    type: "file",
                    from: "sample.ejs",
                    to: `${name}/${h.config.templatesFolder}/sample.ejs`,
                },
            ]
        }
    }
}