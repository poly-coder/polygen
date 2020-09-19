import consola, { Consola, LogLevel } from "consola";
import commander from "commander";
import { PCGenProgramOptions } from "./common";
import chalk from "chalk";
import { capitalCase } from "change-case";

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

export function getConsola(opts: PCGenProgramOptions) {
    return consola.create({
        level: opts.logLevel,
    })
}

export function printField(key: string, value: any, indent: string = '') {
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

export function printDetails(details?: any, indent: string = '') {
    if (details) {
        for (const [key, value] of Object.entries(details)) {
            printField(capitalCase(key), value, indent);
        }
    }
}

export function tracedError(console: Consola, message: string) {
    console.error(message);
    return new Error(message)
}
