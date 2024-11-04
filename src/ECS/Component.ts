import * as Three from "three";
import { dirty } from "./Internal.ts";

export class Component {}

export class Transform extends Component
{
	get posX() { return this.#posX; }
	set posX(value: number) { this.#posX = value; this[dirty] = true; }
	get posY() { return this.#posY; }
	set posY(value: number) { this.#posY = value; this[dirty] = true; }
	get posZ() { return this.#posZ; }
	set posZ(value: number) { this.#posZ = value; this[dirty] = true; }

	get rotX() { return this.#rotX; }
	set rotX(value: number) { this.#rotX = value; this[dirty] = true; }
	get rotY() { return this.#rotY; }
	set rotY(value: number) { this.#rotY = value; this[dirty] = true; }
	get rotZ() { return this.#rotZ; }
	set rotZ(value: number) { this.#rotZ = value; this[dirty] = true; }

	get scaleX() { return this.#scaleX; }
	set scaleX(value: number) { this.#scaleX = value; this[dirty] = true; }
	get scaleY() { return this.#scaleY; }
	set scaleY(value: number) { this.#scaleY = value; this[dirty] = true; }
	get scaleZ() { return this.#scaleZ; }
	set scaleZ(value: number) { this.#scaleZ = value; this[dirty] = true; }

	[dirty] = false;

	#posX = 0;
	#posY = 0;
	#posZ = 0;

	#rotX = 0;
	#rotY = 0;
	#rotZ = 0;

	#scaleX = 1;
	#scaleY = 1;
	#scaleZ = 1;
}

export class MeshRenderer extends Component
{
	constructor( public geometry: Three.BufferGeometry )
	{ super(); }
}

export class InstancedMeshRenderer extends Component
{
	constructor( public geometry: Three.BufferGeometry )
	{ super() }
}

export class BasicMaterial extends Component
{

}

export class PBRMaterial extends Component
{

}

export class DirectionalLight extends Component
{
	target = new Transform();
	intensity = 1;
	color = 0xffffff;
	castShadow = true;
}

export class PointLight extends Component
{
	intensity = 1;
	color = 0xffffff;
	castShadow = true;
}

export class SpotLight extends Component
{
	intensity = 1;
	color = 0xffffff;
	castShadow = true;
}

export class PerspectiveCamera extends Component
{
	fov = 75;
	near = 0.1;
	far = 1000;
}

export class OrthographicCamera extends Component
{
	left = -1;
	right = 1;
	top = 1;
	bottom = -1;
	near = 0.1;
	far = 1000;
}