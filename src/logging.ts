import consola, { LogLevel } from "consola";
import commander from "commander";
import { PolyGenProgramOptions } from "./common";

export function logLevelOption(command: commander.Command) {
    command
        .option(
            '-l, --log-level <level>', 
            'Log level. Any of: fatal or f, error or e, warning or warn or w, log or l, information or info or i, success or s, debug or d, trace or t, silent or verbose or v',
            parseLogLevel,
            LogLevel.Info)
}

function parseLogLevel(value: string) {
    switch (value.toLowerCase()) {
        case "fatal":
        case "f":
            return LogLevel.Fatal;

        case "error":
        case "e":
            return LogLevel.Error;

        case "warning":
        case "warn":
        case "w":
            return LogLevel.Warn;

        case "log":
        case "l":
            return LogLevel.Log;

        case "information":
        case "info":
        case "i":
            return LogLevel.Info;

        case "success":
        case "s":
            return LogLevel.Success;

        case "debug":
        case "d":
            return LogLevel.Debug;

        case "trace":
        case "t":
            return LogLevel.Trace;

        case "silent":
            return LogLevel.Silent;

        case "verbose":
        case "v":
            return LogLevel.Verbose;
    }
    
    return LogLevel.Info;
}

export function getConsola(opts: PolyGenProgramOptions) {
    return consola.create({
        level: opts.logLevel,
    })
}
