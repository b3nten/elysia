/**
 * @module Audio
 * @description This module provides an Audio class for managing and controlling audio playback.
 * It offers various methods for playing, pausing, stopping, and manipulating audio, as well as
 * properties for controlling volume, loop, and other audio characteristics.
 *
 * @example
 * ```ts
 * // Create an AudioPlayer instance
 * const player = new AudioPlayer();
 *
 * // Load and create an Audio instance
 * const audioBytes = await fetch("path/to/audio.mp3").then(res => res.arrayBuffer());
 * const audio = player.createAudio({ bytes: audioBytes });
 *
 * // Play the audio
 * audio.play();
 *
 * // Pause the audio after 5 seconds
 * setTimeout(() => {
 *   audio.pause();
 * }, 5000);
 *
 * // Change volume
 * audio.volume = 0.5;
 *
 * // Seek to a specific position
 * audio.seek(10); // Seek to 10 seconds
 * ```
 */

import { AudioPlayer } from "./AudioPlayer.ts";
import { Queue } from "../Containers/Queue.ts";
import { EventDispatcher } from "../Events/EventDispatcher.ts";
import * as Events from "./AudioEvents.ts";
import { ASSERT } from "../Shared/Asserts.ts";
import { isBrowser } from "../Shared/Asserts.ts";
import { clamp } from "../Math/Other.ts";

export interface AudioConstructorArguments {
	/** An array buffer containing the audio file. */
	bytes: ArrayBuffer;
	/** The audio player instance to use. */
	player: AudioPlayer;
	/** Whether the audio should loop. */
	loop?: boolean;
	/** The volume of the audio. */
	volume?: number;
	/** An array of custom audio nodes to connect to the audio source. */
	nodes?: AudioNode[];
}

/**
 * Represents an audio instance with playback controls and properties.
 */
export class Audio {
	/** Whether the audio is currently loading */
	get loading(): boolean {
		return !this.#ready;
	}

	/** Whether the audio is ready to be played */
	get ready(): boolean {
		return this.#ready;
	}

	/** The error that occurred while loading the audio, if any */
	get error(): Error | undefined {
		return this.#error;
	}

	/** Whether the audio is currently playing */
	get playing(): boolean {
		return this.#playing;
	}
	set playing(value: boolean) {
		value ? this.play() : this.pause();
	}

	/** Whether the audio is currently paused */
	get paused(): boolean {
		return this.#paused;
	}
	set paused(value: boolean) {
		value ? this.pause() : this.play();
	}

	/** Whether the audio is currently stopped */
	get stopped(): boolean {
		return this.#stopped;
	}
	set stopped(value: boolean) {
		value ? this.stop() : this.play();
	}

	/** Whether the audio is currently muted */
	get muted(): boolean {
		return this.#muted;
	}
	set muted(value: boolean) {
		value ? this.mute() : this.unmute();
	}

	/** Whether the audio should loop */
	get loop(): boolean {
		return this.#loop;
	}
	set loop(value: boolean) {
		if (!isBrowser()) return;
		if (!this.#ready) {
			this.#eventQueue.enqueue(() => (this.loop = value));
			return;
		}
		ASSERT(!!this.#source, "Cannot set loop before audio is loaded");
		this.#loop = value;
		this.#source.loop = value;
	}

	/** The volume of the audio */
	get volume(): number {
		return this.#volume;
	}
	set volume(value: number) {
		if (!isBrowser()) return;
		if (!this.#ready) {
			this.#eventQueue.enqueue(() => (this.volume = value));
			return;
		}
		this.#volume = clamp(value, 0, 1);
		this.#gainNode.gain.value = this.#volume;
	}

	/** The current position of the audio */
	get position(): number {
		return this.#position;
	}
	set position(value: number) {
		this.seek(value);
	}

	/** The duration of the audio */
	get duration(): number {
		return this.#duration;
	}

	constructor(args: AudioConstructorArguments) {
		if (!isBrowser()) {
			return;
		}

		this.#player = args.player;
		this.#buffer = args.bytes;
		this.#userNodes = args.nodes || [];
		this.#loop = args.loop || false;
		this.#volume = args.volume || 1;
		this.#gainNode = AudioPlayer.GetContext().createGain();
		this.addEventListener = this.#eventDispatcher.addEventListener.bind(
			this.#eventDispatcher,
		);
		this.removeEventListener = this.#eventDispatcher.removeEventListener.bind(
			this.#eventDispatcher,
		);

		this.#player.instances.add(new WeakRef(this));

		this.#player.createAudioBuffer(this.#buffer).then(
			(buffer) => {
				if (!buffer) {
					this.#error = new Error("Failed to create audio buffer");
					this.#eventDispatcher.dispatchEvent(new Events.AudioErrorEvent(this));
					return;
				}
				this.#audioBuffer = buffer;
				this.#duration = buffer.duration;
				this.#eventQueue.flush((x) => x?.());
			},
			(error) => {
				this.#error = error;
			},
		);
	}

	/** Play an instance of the audio once */
	fire() {
		if (!isBrowser()) return;

		if (!this.#ready) {
			this.#eventQueue.enqueue(() => this.fire());
			return;
		}

		if (!this.#audioBuffer) return;

		const src = AudioPlayer.GetContext().createBufferSource();
		src.buffer = this.#audioBuffer;
		src.connect(this.#gainNode).connect(AudioPlayer.GetContext().destination);
		src.start(0);
	}

	/** Begin playing the audio */
	play() {
		if (!isBrowser()) return;

		if (!this.#ready) {
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

	/** Pause the audio */
	pause() {
		if (!isBrowser()) return;

		if (!this.#ready) {
			this.#eventQueue.enqueue(() => this.pause());
			return;
		}

		const ctx = AudioPlayer.GetContext();

		if (this.#source) {
			this.destroySource(this.#source);
		}

		this.#playing = false;
		this.#position += ctx.currentTime - (this.#startedAt ?? 0);
		this.#paused = true;
		this.#stopped = false;

		this.#eventDispatcher.dispatchEvent(new Events.AudioPauseEvent(this));
	}

	/** Toggle between playing and pausing the audio */
	togglePause() {
		this.#paused ? this.play() : this.pause();
	}
	/** Toggle between playing and pausing the audio */
	togglePlay() {
		this.#playing ? this.pause() : this.play();
	}

	/** Stop the audio */
	stop() {
		if (!isBrowser()) return;

		if (!this.#ready) {
			this.#eventQueue.enqueue(() => this.stop());
			return;
		}

		if (!this.#source) {
			return;
		}

		this.destroySource(this.#source);

		this.#playing = false;

		this.#paused = false;

		this.#stopped = true;

		this.#position = 0;

		this.#eventDispatcher.dispatchEvent(new Events.AudioStopEvent(this));
	}

	/** Mute the audio */
	mute() {
		if (!isBrowser()) return;

		if (!this.#ready) {
			this.#eventQueue.enqueue(() => this.mute());
			return;
		}

		this.#gainNode.gain.value = 0;

		this.#muted = true;

		this.#eventDispatcher.dispatchEvent(new Events.AudioMuteEvent(this));
	}

	/** Unmute the audio */
	unmute() {
		if (!isBrowser()) return;

		if (!this.#ready) {
			this.#eventQueue.enqueue(() => this.unmute());
			return;
		}

		this.#gainNode.gain.value = this.#volume;

		this.#muted = false;

		this.#eventDispatcher.dispatchEvent(new Events.AudioVolumeEvent(this));
	}

	/** Toggle between muting and unmuting the audio */
	toggleMute() {
		this.#muted ? this.unmute() : this.mute();
	}

	/** Seek to a specific position in the audio */
	seek(position: number) {
		if (!isBrowser()) return;

		if (!this.#ready) {
			this.#eventQueue.enqueue(() => this.seek(position));
			return;
		}

		this.#position = clamp(position, 0, this.#duration);

		this.#eventDispatcher.dispatchEvent(new Events.AudioSeekEvent(this));

		if (this.#playing) {
			ASSERT(!!this.#source, "No source to seek");

			this.destroySource(this.#source);

			this.#playing = false;

			this.play();
		}
	}

	/** Clone this audio node */
	clone(): Audio {
		if (!this.#buffer)
			throw new Error("Cannot clone an audio instance without a buffer");

		return new Audio({
			player: this.#player,
			bytes: this.#buffer,
			loop: this.#loop,
			volume: this.#volume,
			nodes: this.#userNodes,
		});
	}

	addEventListener!: EventDispatcher["addEventListener"];
	removeEventListener!: EventDispatcher["removeEventListener"];

	private onAudioEnd() {
		this.#paused = false;
		this.#stopped = true;
		this.#playing = false;
		this.#position = 0;
		this.#eventDispatcher.dispatchEvent(new Events.AudioStopEvent(this));
	}

	private destroySource(source: AudioBufferSourceNode) {
		source.disconnect();
		source.stop();
		source.removeEventListener("ended", this.onAudioEnd);
	}

	#eventDispatcher = new EventDispatcher();
	#paused = false;
	#stopped = true;
	#playing = false;
	#muted = false;
	#position = 0;
	#eventQueue = new Queue<any>();
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
