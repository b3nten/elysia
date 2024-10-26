import { AudioPlayer } from "./AudioPlayer.ts";
import { Queue } from "../Containers/Queue.ts";
import { ElysiaEventDispatcher } from "../Events/EventDispatcher.ts";
import * as Events from "./AudioEvents.ts";
import { ASSERT } from "../Core/Asserts.ts";
import { isBrowser } from "../Core/Asserts.ts";

export interface AudioConstructorArguments {
	bytes: ArrayBuffer;
	player: AudioPlayer;
	loop?: boolean;
	volume?: number;
	nodes?: AudioNode[];
}

export class Audio
{
	get loading(): boolean { return !this.#ready; }

	get ready(): boolean { return this.#ready; }

	get error(): Error | undefined { return this.#error; }

	get playing(): boolean { return this.#playing; }

	set playing(value: boolean) { value ? this.play() : this.pause(); }

	get paused(): boolean { return this.#paused; }

	set paused(value: boolean) { value ? this.pause() : this.play(); }

	get stopped(): boolean { return this.#stopped; }

	set stopped(value: boolean) { value ? this.stop() : this.play(); }

	get muted(): boolean { return this.#muted; }

	set muted(value: boolean) { value ? this.mute() : this.unmute(); }

	get loop(): boolean { return this.#loop; }

	set loop(value: boolean)
	{
		if (!isBrowser()) return;
		if(!this.#ready)
		{
			this.#eventQueue.enqueue(() => this.loop = value);
			return;
		}
		ASSERT(!!this.#source, "Cannot set loop before audio is loaded");
		this.#loop = value;
		this.#source.loop = value;
	}

	get volume(): number { return this.#volume; }

	set volume(value: number)
	{
		if (!isBrowser()) return;
		if(!this.#ready)
		{
			this.#eventQueue.enqueue(() => this.volume = value);
			return;
		}
		this.#volume = clamp(value, 0, 1);
		this.#gainNode.gain.value = this.#volume;
	}

	get position(): number { return this.#position; }

	set position(value: number) { this.seek(value); }

	get duration(): number { return this.#duration; }

	constructor(args: AudioConstructorArguments)
	{
		if(!isBrowser()){
			return;
		}

		this.#player = args.player;
		this.#buffer = args.bytes;
		this.#userNodes = args.nodes || [];
		this.#loop = args.loop || false;
		this.#volume = args.volume || 1;
		this.#gainNode = AudioPlayer.GetContext().createGain();
		this.addEventListener = this.#eventDispatcher.addEventListener.bind(this.#eventDispatcher);
		this.removeEventListener = this.#eventDispatcher.removeEventListener.bind(this.#eventDispatcher);

		this.#player.instances.add(new WeakRef(this));

		this.#player.createAudioBuffer(this.#buffer).then(
			(buffer) =>
			{
				if(!buffer)
				{
					this.#error = new Error("Failed to create audio buffer");
					this.#eventDispatcher.dispatchEvent(new Events.AudioErrorEvent(this));
					return;
				}
				this.#audioBuffer = buffer;
				this.#duration = buffer.duration;
				this.#eventQueue.flush(x => x?.())
			},
			(error) =>
			{
				this.#error = error;
			}
		)
	}

	fire()
	{
		if (!isBrowser()) return;

		if(!this.#ready)
		{
			this.#eventQueue.enqueue(() => this.fire());
			return;
		}

		if (!this.#audioBuffer) return;

		const src = AudioPlayer.GetContext().createBufferSource();
		src.buffer = this.#audioBuffer;
		src.connect(this.#gainNode).connect(AudioPlayer.GetContext().destination);
		src.start(0);
	}

	play()
	{
		if (!isBrowser()) return;

		if(!this.#ready)
		{
			this.#eventQueue.enqueue(() => this.play());
			return;
		}

		if (!this.#audioBuffer || this.#playing) {
			return;
		}

		const ctx = AudioPlayer.GetContext();

		this.#source = ctx.createBufferSource();
		this.#source!.buffer = this.#audioBuffer;
		this.#source!.loop = this.#loop;
		this.#source!.connect(this.#gainNode);

		let nextNode: AudioNode = this.#gainNode;

		for (const node of this.#userNodes) {
			nextNode.connect(node);
			nextNode = node;
		}

		nextNode.connect(ctx.destination);

		this.#source!.start(0, this.#position);
		this.#startedAt = ctx.currentTime;
		this.#playing = true;
		this.#paused = false;
		this.#stopped = false;

		this.#source!.addEventListener("ended", this.onAudioEnd);

		this.#eventDispatcher.dispatchEvent(new Events.AudioPlayEvent(this));
	}

	pause()
	{
		if (!isBrowser()) return;

		if(!this.#ready)
		{
			this.#eventQueue.enqueue(() => this.pause());
			return;
		}

		const ctx = AudioPlayer.GetContext();

		if(this.#source){
			this.destroySource(this.#source);
		}

		this.#playing = false;
		this.#position += ctx.currentTime - (this.#startedAt ?? 0);
		this.#paused = true;
		this.#stopped = false;

		this.#eventDispatcher.dispatchEvent(new Events.AudioPauseEvent(this));
	}

	togglePlay() { this.#playing ? this.pause() : this.play(); }

	stop()
	{
		if (!isBrowser()) return;

		if(!this.#ready)
		{
			this.#eventQueue.enqueue(() => this.stop());
			return;
		}

		if(!this.#source)
		{
			return;
		}

		this.destroySource(this.#source);

		this.#playing = false;

		this.#paused = false;

		this.#stopped = true;

		this.#position = 0;

		this.#eventDispatcher.dispatchEvent(new Events.AudioStopEvent(this));
	}

	mute()
	{
		if (!isBrowser()) return;

		if(!this.#ready)
		{
			this.#eventQueue.enqueue(() => this.mute());
			return;
		}

		this.#gainNode.gain.value = 0;

		this.#muted = true;

		this.#eventDispatcher.dispatchEvent(new Events.AudioMuteEvent(this));
	}

	unmute()
	{
		if (!isBrowser()) return;

		if(!this.#ready)
		{
			this.#eventQueue.enqueue(() => this.unmute());
			return;
		}

		this.#gainNode.gain.value = this.#volume;

		this.#muted = false;

		this.#eventDispatcher.dispatchEvent(new Events.AudioVolumeEvent(this));
	}

	toggleMute() { this.#muted ? this.unmute() : this.mute(); }

	seek(position: number)
	{
		if (!isBrowser()) return;

		if(!this.#ready)
		{
			this.#eventQueue.enqueue(() => this.seek(position));
			return;
		}

		this.#position = clamp(position, 0, this.#duration);

		this.#eventDispatcher.dispatchEvent(new Events.AudioSeekEvent(this));

		if (this.#playing)
		{
			ASSERT(!!this.#source, "No source to seek");

			this.destroySource(this.#source);

			this.#playing = false;

			this.play();
		}
	}

	clone(): Audio
	{
		if (!this.#buffer)
			throw new Error(
				"Cannot clone an audio instance without a buffer",
			);

		return new Audio({
			player: this.#player,
			bytes: this.#buffer,
			loop: this.#loop,
			volume: this.#volume,
			nodes: this.#userNodes,
		});
	}

	addEventListener!: ElysiaEventDispatcher["addEventListener"]
	removeEventListener!: ElysiaEventDispatcher["removeEventListener"]

	private onAudioEnd()
	{
		this.#paused = false;
		this.#stopped = true;
		this.#playing = false;
		this.#position = 0;
		this.#eventDispatcher.dispatchEvent(new Events.AudioStopEvent(this));
	};

	private destroySource(source: AudioBufferSourceNode)
	{
		source.disconnect();
		source.stop();
		source.removeEventListener("ended", this.onAudioEnd);
	}

	#eventDispatcher = new ElysiaEventDispatcher;
	#paused = false;
	#stopped = true;
	#playing = false;
	#muted = false;
	#position = 0;
	#eventQueue = new Queue<any>
	#gainNode!: GainNode;
	#userNodes!: AudioNode[];
	#volume: number = 1;
	#player!: AudioPlayer;
	#buffer!: ArrayBuffer;
	#audioBuffer?: AudioBuffer;
	#source?: AudioBufferSourceNode;
	#loop!: boolean;
	#startedAt?: number;
	#duration: number = 0;
	#ready = false;
	#error?: Error;
}

const clamp = (value: number, min: number, max: number) =>
	Math.max(min, Math.min(max, value));
