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

export function sprintList(list: string[], style: chalk.Chalk, sep: string = ', ') {
    return list.map(value => style(value)).join(sep)
}

export function sprintGoodList(list: string[], sep: string = ', ') {
    return sprintList(list, chalk.greenBright, sep)
}

export function sprintBadList(list: any[], sep: string = ', ') {
    return sprintList(list, chalk.redBright, sep)
}

export function sprintGood(value: any) {
    return chalk.greenBright(value)
}

export function sprintBad(value: any) {
    return chalk.redBright(value)
}

export function sprintWarn(value: any) {
    return chalk.yellowBright(value)
}

export function sprintInfo(value: any) {
    return chalk.cyanBright(value)
}

export function sprintLabel(value: any) {
    return chalk.white(value)
}

export function sprintDark(value: any) {
    return chalk.gray(value)
}

export function printField(key: string, value: any, indent: string = '') {
  if (value == null || value == undefined) {
      return
  }
  if ((key + value).length > 40) {
      consola.log(`${indent}    ${sprintLabel(key)}:`)
      consola.log(`${indent}        ${sprintInfo(value)}`)
  } else {
      consola.log(`${indent}    ${sprintLabel(key)}: ${sprintInfo(value)}`)
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
  return sprintInfo(name)
}
