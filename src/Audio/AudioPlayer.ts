import { ASSERT, isBrowser } from "../Shared/Asserts.ts";
import { Audio, type AudioConstructorArguments } from "./Audio.ts";

export class AudioPlayer
{
	/** Get the shared AudioContext */
	static GetContext(): AudioContext
	{
		// @ts-ignore - global
		return globalThis.ELYSIA_AUDIO_CTX;
	}

	static
	{
		if(isBrowser())
		{
			// @ts-ignore - global
			if(!globalThis.ELYSIA_AUDIO_CTX)
			{
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
	readonly instances: Set<WeakRef<Audio>> = new Set;

	/**
	 * A cache of audio buffers.
	 */
	readonly cache: Map<string | ArrayBuffer, Promise<AudioBuffer>> = new Map;

	/**
	 * Enable debug logd
	 */
	debug = false;

	get muteOnBlur(): boolean
	{
		return this.#muteOnBlur;
	}

	set muteOnBlur(value: boolean)
	{
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

	createAudio(args: AudioConstructorArguments): Audio
	{
		if(!isBrowser())
		{
			return new Audio(args);
		}

		return new Audio(Object.assign(args, { player: this }));
	}

	muteAll()
	{
		if (!isBrowser()) return;
		this.instances.forEach((ref) => {
			const player = ref.deref();
			if (player) {
				player.mute();
			}
		});
	}

	unmuteAll()
	{
		if (!isBrowser()) return;
		this.instances.forEach((ref) => {
			const player = ref.deref();
			if (player) {
				player.unmute();
			}
		});
	}

	pauseAll() {
		if (!isBrowser()) return;
		this.instances.forEach((ref) => {
			const player = ref.deref();
			if (player) {
				player.pause();
			}
		});
	}

	stopAll() {
		if (!isBrowser()) return;
		this.instances.forEach((ref) => {
			const player = ref.deref();
			if (player) {
				player.stop();
			}
		});
	}

	createAudioBuffer(
		input: ArrayBuffer,
	): Promise<AudioBuffer | undefined> {
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

	constructor()
	{
		if(!isBrowser())
			return;

		setInterval(() =>
		{
			for (const ref of this.instances)
			{
				if (!ref.deref())
				{
					this.instances.delete(ref);
				}
			}
		}, 10000);
	}

	#muteOnBlur = false;
}
