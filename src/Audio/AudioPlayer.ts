import { ASSERT, isBrowser } from "../Core/Asserts.ts";
import { Audio, AudioConstructorArguments } from "./Audio.ts";
export class AudioPlayer
{

	static GetContext(): AudioContext
	{
		// @ts-ignore - global
		return window.ELYSIA_AUDIO_CTX;
	}

	static
	{
		if(isBrowser())
		{
			// @ts-ignore - global
			if(!window.ELYSIA_AUDIO_CTX)
			{
				// @ts-ignore - global
				window.ELYSIA_AUDIO_CTX = new AudioContext();
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

	readonly instances: Set<WeakRef<Audio>> = new Set;

	readonly cache: Map<string | ArrayBuffer, Promise<AudioBuffer>> = new Map;

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
			window.addEventListener("blur", this.muteAll);
			window.addEventListener("focus", this.unmuteAll);
		} else {
			window.removeEventListener("blur", this.muteAll);
			window.removeEventListener("focus", this.unmuteAll);
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
			requestIdleCallback(() =>
			{
				for (const ref of this.instances)
				{
					if (!ref.deref())
					{
						this.instances.delete(ref);
					}
				}
			})
		}, 10000);
	}

	#muteOnBlur = false;
}
