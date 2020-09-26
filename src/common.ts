import { GlobalOptions } from "./types";

export function getOptions<T extends GlobalOptions>(args: any): T {
  const parentOpts = args.parent ? getOptions(args.parent) : {};

  return {
      ...parentOpts,
      ...args.opts(),
  };
}
