/**
 * @module
 *
 * This actor is responsible for rendering environment maps or scenes. It attaches to the scene and sets the environment map or scene as the background or environment of the scene.
 * You can optionally specify the rotation of the environment map or scene, the intensity of the environment, and whether the environment should be used as the background.
 *
 * @example
 * ```ts
 * const env = new EnvironmentActor;
 * env.texture = app.assets.unwrap("envMap");
 * env.background = true;
 * env.backgroundIntensity = 0.5;
 * env.backgroundBlur = 2;
 * scene.add(env);
 */

// @ts-types="npm:@types/three@^0.169.0"
import * as Three from 'three';
import { Actor } from "../Scene/Actor.ts";
import {
	BackSide,
	BoxGeometry,
	Mesh,
	MeshBasicMaterial,
	MeshStandardMaterial,
	PointLight,
	Scene,
} from 'three';
import { Colors } from "../Core/Colors.ts";
import type { Maybe } from "../Core/mod.ts";

class RoomEnvironment extends Scene {
	constructor()
	{
		super();

		const geometry = new BoxGeometry();
		geometry.deleteAttribute( 'uv' );

		const roomMaterial = new MeshStandardMaterial( { side: BackSide, color: Colors.VonCount } );
		const boxMaterial = new MeshStandardMaterial({ color: Colors.VonCount });

		const mainLight = new PointLight( 0xffffff, 900, 28, 2 );
		mainLight.position.set( 0.418, 16.199, 0.300 );
		this.add( mainLight );

		const room = new Mesh( geometry, roomMaterial );
		room.position.set( - 0.757, 13.219, 0.717 );
		room.scale.set( 31.713, 28.305, 28.591 );
		this.add( room );

		const box1 = new Mesh( geometry, boxMaterial );
		box1.position.set( - 10.906, 2.009, 1.846 );
		box1.rotation.set( 0, - 0.195, 0 );
		box1.scale.set( 2.328, 7.905, 4.651 );
		this.add( box1 );

		const box2 = new Mesh( geometry, boxMaterial );
		box2.position.set( - 5.607, - 0.754, - 0.758 );
		box2.rotation.set( 0, 0.994, 0 );
		box2.scale.set( 1.970, 1.534, 3.955 );
		this.add( box2 );

		const box3 = new Mesh( geometry, boxMaterial );
		box3.position.set( 6.167, 0.857, 7.803 );
		box3.rotation.set( 0, 0.561, 0 );
		box3.scale.set( 3.927, 6.285, 3.687 );
		this.add( box3 );

		const box4 = new Mesh( geometry, boxMaterial );
		box4.position.set( - 2.017, 0.018, 6.124 );
		box4.rotation.set( 0, 0.333, 0 );
		box4.scale.set( 2.002, 4.566, 2.064 );
		this.add( box4 );

		const box5 = new Mesh( geometry, boxMaterial );
		box5.position.set( 2.291, - 0.756, - 2.621 );
		box5.rotation.set( 0, - 0.286, 0 );
		box5.scale.set( 1.546, 1.552, 1.496 );
		this.add( box5 );

		const box6 = new Mesh( geometry, boxMaterial );
		box6.position.set( - 2.193, - 0.369, - 5.547 );
		box6.rotation.set( 0, 0.516, 0 );
		box6.scale.set( 3.875, 3.487, 2.986 );
		this.add( box6 );


		// -x right
		const light1 = new Mesh( geometry, createAreaLightMaterial( 50 ) );
		light1.position.set( - 16.116, 14.37, 8.208 );
		light1.scale.set( 0.1, 2.428, 2.739 );
		this.add( light1 );

		// -x left
		const light2 = new Mesh( geometry, createAreaLightMaterial( 50 ) );
		light2.position.set( - 16.109, 18.021, - 8.207 );
		light2.scale.set( 0.1, 2.425, 2.751 );
		this.add( light2 );

		// +x
		const light3 = new Mesh( geometry, createAreaLightMaterial( 17 ) );
		light3.position.set( 14.904, 12.198, - 1.832 );
		light3.scale.set( 0.15, 4.265, 6.331 );
		this.add( light3 );

		// +z
		const light4 = new Mesh( geometry, createAreaLightMaterial( 43 ) );
		light4.position.set( - 0.462, 8.89, 14.520 );
		light4.scale.set( 4.38, 5.441, 0.088 );
		this.add( light4 );

		// -z
		const light5 = new Mesh( geometry, createAreaLightMaterial( 20 ) );
		light5.position.set( 3.235, 11.486, - 12.541 );
		light5.scale.set( 2.5, 2.0, 0.1 );
		this.add( light5 );

		// +y
		const light6 = new Mesh( geometry, createAreaLightMaterial( 100 ) );
		light6.position.set( 0.0, 20.0, 0.0 );
		light6.scale.set( 1.0, 0.1, 1.0 );
		this.add( light6 );

	}
}

function createAreaLightMaterial( intensity: number ) {

	const material = new MeshBasicMaterial();
	material.color.setScalar( intensity );
	return material;
}

function constructScene(pmremGenerator: Three.PMREMGenerator, envScene: Three.Scene)
{
	const envMap = pmremGenerator.fromScene(envScene).texture;
	pmremGenerator.dispose();
	return envMap;
}

type EnvironmentArgs = {
	texture?: Three.Texture | Three.CubeTexture;
	envScene?: Three.Scene;
	rotation?: Three.Euler;
	environmentIntensity?: number;
	background?: boolean;
	backgroundIntensity?: number;
	backgroundBlur?: number;
};

export class EnvironmentActor extends Actor
{
	/**
	 * The texture or cube texture to use as the environment map.
	 */
	get texture(): Three.Texture | null { return this.#texture; }
	set texture(v: Three.Texture | Three.CubeTexture | null) { this.#texture = v; this.updateState(); }

	/**
	 * The scene to use as the environment map.
	 */
	get envScene(): Maybe<Three.Scene> { return this.#envScene; }
	set envScene(v: Maybe<Three.Scene>) { this.#envScene = v; this.updateState(); }

	/**
	 * The intensity of the environment map.
	 */
	get intensity(): number { return this.#environmentIntensity; }
	set intensity(v: number) { this.#environmentIntensity = v; this.updateState(); }

	/**
	 * Whether the environment map should be used as the background.
	 */
	get background(): boolean { return this.#background; }
	set background(v: boolean) { this.#background = v; this.updateState(); }

	/**
	 * The intensity of the background.
	 */
	get backgroundIntensity(): number { return this.#backgroundIntensity; }
	set backgroundIntensity(v: number) { this.#backgroundIntensity = v; this.updateState(); }

	/**
	 * The blur of the background.
	 */
	get backgroundBlur(): number { return this.#backgroundBlur; }
	set backgroundBlur(v: number) { this.#backgroundBlur = v; this.updateState(); }

	constructor(args: EnvironmentArgs = {})
	{
		super();
		this.#texture = args.texture ?? null;
		this.#envScene = args.envScene ?? null;
		this.#environmentIntensity = args.environmentIntensity ?? 1;
		this.#background = args.background ?? false;
		this.#backgroundIntensity = args.backgroundIntensity ?? 1;
		this.#backgroundBlur = args.backgroundBlur ?? 0;
	}

	/**
	 * Update the state of the environment.
	 * This is usually called automatically, in most cases is unnecessary to call manually.
	 */
	updateState()
	{
		const renderer = this.app?.renderPipeline.getRenderer();
		const pmremGenerator = this.#pmremGenerator;

		if (!this.scene || !renderer)
			return;

		if (this.#texture) { this.scene.object3d.environment = this.#texture; }
		else if (this.#envScene && pmremGenerator)
		{
			this.#texture = constructScene(
				pmremGenerator,
				this.#envScene,
			);
			this.scene.object3d.environment = this.#texture;
		}
		else if(pmremGenerator)
		{
			const roomEnv = new RoomEnvironment();
			this.#texture = constructScene(
				pmremGenerator,
				roomEnv,
			);
			this.scene.object3d.environment = this.#texture;
		}

		if (this.#background)
		{
			this.scene.object3d.backgroundIntensity = this.#backgroundIntensity;
			this.scene.object3d.backgroundRotation = new Three.Euler().setFromQuaternion(this.rotation);
			this.scene.object3d.backgroundBlurriness = this.#backgroundBlur;
			this.scene.object3d.background = this.#texture;
		}
		else
		{
			this.scene.object3d.background = null;
		}

		this.scene.object3d.environmentIntensity = this.#environmentIntensity;
		this.scene.object3d.environmentRotation = new Three.Euler().setFromQuaternion(this.rotation);
	}

	override onCreate()
	{
		const renderer = this.app?.renderPipeline.getRenderer();
		if(!renderer) throw new Error("Renderer not found");

		this.#pmremGenerator = new Three.PMREMGenerator(renderer);
		this.updateState();
	}

	override onEnable() { this.updateState(); }

	override onDisable()
	{
		if(this.scene?.object3d?.background === this.#texture) { this.scene.object3d.background = null; }
	}

	override onDestroy() { this.#pmremGenerator?.dispose(); }

	#pmremGenerator?: Three.PMREMGenerator;
	#texture: Three.Texture | Three.CubeTexture | null;
	#envScene: Maybe<Three.Scene>;
	#environmentIntensity: number;
	#background: boolean;
	#backgroundIntensity: number;
	#backgroundBlur: number;
}
