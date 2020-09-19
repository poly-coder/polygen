import { Consola } from "consola";

export function tracedError(console: Consola, message: string) {
    console.trace(message);
    return new Error(message)
}
