import { LogLevel } from "consola";

export interface PolyGenProgramOptions {
    readonly version: string;
    readonly logLevel: LogLevel;
}

export function getOptions<T extends PolyGenProgramOptions>(args: any): T {
    const parentOpts = args.parent ? getOptions(args.parent) : {};

    return {
        ...parentOpts,
        ...args.opts(),
    };
}
