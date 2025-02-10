import { createEvent } from "../Events/mod.ts";
import type { Audio } from "./Audio.ts";

export const AudioPlayEvent = createEvent<Audio>("AudioPlayEvent");
export const AudioPauseEvent = createEvent<Audio>("AudioPauseEvent");
export const AudioStopEvent = createEvent<Audio>("AudioStopEvent");
export const AudioSeekEvent = createEvent<Audio>("AudioSeekEvent");
export const AudioVolumeEvent = createEvent<Audio>("AudioVolumeEvent");
export const AudioErrorEvent = createEvent<Audio>("AudioErrorEvent");
export const AudioMuteEvent = createEvent<Audio>("AudioMuteEvent");
