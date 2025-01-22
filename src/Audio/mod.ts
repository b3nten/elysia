/**
 * @module Audio
 * @description This module provides an audio management system.
 * It includes classes for audio playback control, audio player management, and audio-related events.
 * The module is designed to work in browser environments and offers features such as playing,
 * pausing, stopping, and manipulating audio, as well as managing multiple audio instances.
 *
 * Key components:
 * - Audio: Represents an individual audio instance with playback controls.
 * - AudioPlayer: Manages multiple audio instances and provides global audio controls.
 * - AudioEvents: Defines various events related to audio playback and state changes.
 *
 * @example
 * ```typescript
 * import { AudioPlayer, Audio } from './mod.ts';
 *
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
 * // Adjust volume
 * audio.volume = 0.7;
 *
 * // Pause after 5 seconds
 * setTimeout(() => {
 *   audio.pause();
 * }, 5000);
 *
 * // Stop all audio when the window loses focus
 * player.muteOnBlur = true;
 *
 * // Listen for audio events
 * audio.addEventListener('play', () => console.log('Audio started playing'));
 * audio.addEventListener('pause', () => console.log('Audio paused'));
 * ```
 */

export * from "./mod.ts";
export * from "./AudioPlayer.ts";
export * from "./Audio.ts";
export * from "./AudioEvents.ts";
