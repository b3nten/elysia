// @ts-types="npm:@types/three@^0.169.0"
import * as Three from 'three';
import { Behavior } from "../Scene/Behavior.ts";

type FloatArgs =
	{
	offset?: number;
	speed?: number;
	rotationIntensity?: number;
	floatIntensity?: number;
	floatingRange?: [number, number];
};
/** A behavior that makes an object smoothly float and rotate. */
export class FloatBehavior extends Behavior
{
	override type: string = 'FloatBehavior';

	get offset(): number { return this.#offset; }
	set offset(value: number) { this.#offset = value; }

	get speed(): number { return this.#speed; }
	set speed(value: number) { this.#speed = value; }

	get rotationIntensity(): number { return this.#rotationIntensity; }
	set rotationIntensity(value: number) { this.#rotationIntensity = value; }

	get floatIntensity(): number { return this.#floatIntensity; }
	set floatIntensity(value: number) { this.#floatIntensity = value; }

	get floatingRange(): [number, number] { return this.#floatingRange; }
	set floatingRange(value: [number, number]) { this.#floatingRange = value; }

	constructor(args: FloatArgs = {})
	{
		super();
		this.#offset = args.offset ?? Math.random() * 10000;
		this.#speed = args.speed ?? 1;
		this.#rotationIntensity = args.rotationIntensity ?? 1;
		this.#floatIntensity = args.floatIntensity ?? 1;
		this.#floatingRange = args.floatingRange ?? [-0.1, 0.1];
	}

	override onUpdate(frametime: number, elapsedtime: number)
	{
		if (this.#speed === 0 || !this.parent) return;

		const t = this.#offset + elapsedtime;

		this.parent.rotation.x =
			(Math.cos((t / 4) * this.#speed * 2) / 8) * this.#rotationIntensity;
		this.parent.rotation.y =
			(Math.sin((t / 4) * this.#speed * 2) / 8) * this.#rotationIntensity;
		this.parent.rotation.z =
			(Math.sin((t / 4) * this.#speed * 2) / 20) * this.#rotationIntensity;

		let yPosition = Math.sin((t / 4) * this.#speed * 2) / 10;

		yPosition = Three.MathUtils.mapLinear(
			yPosition,
			-0.1,
			0.1,
			this.#floatingRange?.[0] ?? -0.1,
			this.#floatingRange?.[1] ?? 0.1,
		);

		this.parent.position.y = yPosition * this.#floatIntensity;

		this.parent.object3d.updateMatrix();
	}

	#offset: number;
	#speed: number;
	#rotationIntensity: number;
	#floatIntensity: number;
	#floatingRange: [number, number];
}
