import { LogLevel } from "consola";

export interface PCGenProgramOptions {
    readonly version: string;
    readonly logLevel: LogLevel;
}

export function getOptions<T extends PCGenProgramOptions>(args: any): T {
    const parentOpts = args.parent ? getOptions(args.parent) : {};

    return {
        ...parentOpts,
        ...args.opts(),
    };
}
