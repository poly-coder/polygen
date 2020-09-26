/* istanbul ignore file */
import consola, { LogLevel } from "consola";
import chalk from "chalk";
import { capitalCase } from "change-case";

export function parseLogLevel(value: string) {
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

export function printField(key: string, value: any, indent: string = '') {
  if (value == null || value == undefined) {
      return
  }
  if ((key + value).length > 40) {
      consola.log(chalk`${indent}    {white ${key}}:`)
      consola.log(chalk`${indent}        {gray ${value}}`)
  } else {
      consola.log(chalk`${indent}    {white ${key}}: {gray ${value}}`)
  }
}

export function printDetails(details?: any, indent: string = '') {
  if (details) {
      for (const [key, value] of Object.entries(details)) {
          printField(capitalCase(key), value, indent);
      }
  }
}

export function tracedError(message: string) {
  consola.error(message);
  return new Error(message)
}

export function createLogPrefix(name: string) {
  return chalk`{cyan ${name}}`
}
