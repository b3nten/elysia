export class DevException extends Error {}

export let throwDevException = (message: string, cause: unknown) => {
    throw new DevException(message, { cause });
}