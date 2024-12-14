import { BaseEvent } from "../Events/Event.ts";
import type { Audio } from "./Audio.ts";

export class AudioPlayEvent extends BaseEvent<Audio> {}
export class AudioPauseEvent extends BaseEvent<Audio> {}
export class AudioStopEvent extends BaseEvent<Audio> {}
export class AudioSeekEvent extends BaseEvent<Audio> {}
export class AudioVolumeEvent extends BaseEvent<Audio> {}
export class AudioErrorEvent extends BaseEvent<Audio> {}
export class AudioMuteEvent extends BaseEvent<Audio> {}
