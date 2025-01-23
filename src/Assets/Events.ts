import { createEvent } from "../Events/mod.ts";
import { Asset } from "./Asset.ts";

export const BeginLoadEvent = createEvent("asset:BeginLoadEvent");
export const LoadedEvent = createEvent<Asset<unknown>>("asset:LoadedEvent");
export const ErrorEvent = createEvent<Error>("asset:ErrorEvent");
export const ProgressEvent = createEvent<number>("asset:ProgressEvent");
