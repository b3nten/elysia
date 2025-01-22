/**
 * @module AudioPlayer
 * @description A module for managing audio playback in browser environments.
 *
 * This module provides an AudioPlayer class that handles audio context creation,
 * audio instance management, and various audio control methods.
 *
 * @example
 * ```ts
 * const player = new AudioPlayer();
 * const audio = player.createAudio({ src: 'path/to/audio.mp3' });
 *
 * audio.play();
 *
 * // Mute all audio when window loses focus
 * player.muteOnBlur = true;
 *
 * // Stop all audio
 * player.stopAll();
 */

import { ASSERT, isBrowser } from "../Shared/Asserts.ts";
import { Audio, type AudioConstructorArguments } from "./Audio.ts";

/**
 * Represents an audio player that manages multiple audio instances.
 */
export class AudioPlayer {
	/** Get the shared AudioContext */
	static GetContext(): AudioContext {
		// @ts-ignore - global
		return globalThis.ELYSIA_AUDIO_CTX;
	}

	static {
		if (isBrowser()) {
			// @ts-ignore - global
			if (!globalThis.ELYSIA_AUDIO_CTX) {
				// @ts-ignore - global
				globalThis.ELYSIA_AUDIO_CTX = new AudioContext();
			}

			const unlock = () => {
				document.removeEventListener("click", unlock);
				const source = AudioPlayer.GetContext().createBufferSource();
				source.buffer = AudioPlayer.GetContext().createBuffer(1, 1, 22050);
				source.connect(AudioPlayer.GetContext().destination);
				source.start();
				source.stop();
				source.disconnect();
			};

			document.addEventListener("click", unlock);
		}
	}

	/**
	 * The set of all active audio instances, stored weakly.
	 */
	readonly instances: Set<WeakRef<Audio>> = new Set();

	/**
	 * A cache of audio buffers.
	 */
	readonly cache: Map<string | ArrayBuffer, Promise<AudioBuffer>> = new Map();

	/**
	 * Enable debug logd
	 */
	debug = false;

	get muteOnBlur(): boolean {
		return this.#muteOnBlur;
	}

	set muteOnBlur(value: boolean) {
		this.#muteOnBlur = value;

		if (!isBrowser()) return;

		if (value) {
			globalThis.addEventListener("blur", this.muteAll);
			globalThis.addEventListener("focus", this.unmuteAll);
		} else {
			globalThis.removeEventListener("blur", this.muteAll);
			globalThis.removeEventListener("focus", this.unmuteAll);
		}
	}

	/**
	 * Creates a new Audio instance.
	 * @param {AudioConstructorArguments} args - The arguments for creating the Audio instance.
	 * @returns {Audio} A new Audio instance.
	 */
	createAudio(args: AudioConstructorArguments): Audio {
		if (!isBrowser()) {
			return new Audio(args);
		}

		return new Audio(Object.assign(args, { player: this }));
	}

	/**
	 * Mutes all active audio instances associated with this player.
	 */
	muteAll() {
		if (!isBrowser()) return;
		this.instances.forEach((ref) => {
			const player = ref.deref();
			if (player) {
				player.mute();
			}
		});
	}

	/**
	 * Unmutes all active audio instances associated with this player.
	 */
	unmuteAll() {
		if (!isBrowser()) return;
		this.instances.forEach((ref) => {
			const player = ref.deref();
			if (player) {
				player.unmute();
			}
		});
	}

	/**
	 * Pauses all active audio instances associated with this player.
	 */
	pauseAll() {
		if (!isBrowser()) return;
		this.instances.forEach((ref) => {
			const player = ref.deref();
			if (player) {
				player.pause();
			}
		});
	}

	/**
	 * Stops all active audio instances associated with this player.
	 */
	stopAll() {
		if (!isBrowser()) return;
		this.instances.forEach((ref) => {
			const player = ref.deref();
			if (player) {
				player.stop();
			}
		});
	}

	/**
	 * Creates an AudioBuffer from the given input.
	 * @param {ArrayBuffer} input - The input buffer to decode.
	 * @returns {Promise<AudioBuffer | undefined>} A promise that resolves to the created AudioBuffer, or undefined if not in a browser environment.
	 */
	createAudioBuffer(input: ArrayBuffer): Promise<AudioBuffer | undefined> {
		if (!isBrowser()) {
			return Promise.resolve(undefined);
		}

		ASSERT(AudioPlayer.GetContext(), "AudioContext is not initialized");

		if (this.cache.has(input)) {
			return this.cache.get(input)!;
		}

		this.cache.set(input, AudioPlayer.GetContext().decodeAudioData(input));

		return this.cache.get(input)!;
	}

	#muteOnBlur = false;
}
