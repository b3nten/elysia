import { System } from "./System.ts";
import { Entity } from "./Entity.ts";
import {
	Component, DirectionalLight, PointLight,
	SpotLight, HemisphereLight, AmbientLight,
	Transform
} from "./Component.ts";
// @ts-types="npm:@types/three@^0.169"
import * as Three from 'three';
import { World } from "./World.ts";
import { Scene } from "../Scene/Scene.ts";
import { Constructor } from "../Core/Utilities.ts";

type LightComponent = DirectionalLight | PointLight | SpotLight | HemisphereLight | AmbientLight;
/**
 * Manages entities with a Light component.
 */
export class ThreeLightSystem extends System
{
	override name = "ThreeLightSystem";

	constructor(world: World, public readonly scene: Scene) { super(world); }

	protected override onComponentAdded(entity: Entity, component: Component): void
	{
		if (component instanceof Transform) {
			this.transformAdded(entity, component as Transform);
		} else if (
			component instanceof DirectionalLight ||
			component instanceof PointLight ||
			component instanceof SpotLight ||
			component instanceof HemisphereLight ||
			component instanceof AmbientLight
		) {
			this.lightAdded(entity, component as LightComponent);
		} else {
			console.log("Unknown component type", component);
		}
	}

	protected override onComponentRemoved(entity: Entity, component: Component): void
	{
		if (component instanceof Transform) {
			this.transformRemoved(entity, component as Transform);
		} else if (
			component instanceof DirectionalLight ||
			component instanceof PointLight ||
			component instanceof SpotLight ||
			component instanceof HemisphereLight ||
			component instanceof AmbientLight
		) {
			this.lightRemoved(entity, component as LightComponent);
		} else {
			console.log("Unknown component type", component);
		}
	}

	protected override onUpdate(context: World) {
		for(const componentType of [Transform, DirectionalLight, PointLight, SpotLight, HemisphereLight, AmbientLight] as Constructor<Component>[])
		{
			for(const entity of context.getComponentsByType(componentType))
			{
				const transform = context.getComponent(entity[0], Transform);
				if(transform)
				{
					this.updateLight(
						entity[1] as LightComponent,
						this.backingLightObjects.get(entity[1] as LightComponent)!,
						transform
					);
				}
			}
		}
	}

	private transformAdded(entity: Entity, transform: Transform)
	{
		// need to check if the entity has a light component
		// if it does, we need to add the light to the scene
		for(const lightComponentType of [DirectionalLight, PointLight, SpotLight, HemisphereLight, AmbientLight] as Constructor<Component>[])
		{
			const lightComponent = this.world.getComponent(entity, lightComponentType);
			if(lightComponent)
			{
				this.lightAdded(entity, lightComponent as LightComponent);
			}
		}
	}

	private transformRemoved(entity: Entity, transform: Transform)
	{
		// need to check if the entity has a light component
		// if it does, we need to remove the light from the scene
		for(const lightComponentType of [DirectionalLight, PointLight, SpotLight, HemisphereLight, AmbientLight] as Constructor<Component>[])
		{
			const lightComponent = this.world.getComponent(entity, lightComponentType);
			if(lightComponent)
			{
				this.lightRemoved(entity, lightComponent as LightComponent);
			}
		}
	}

	private lightAdded(entity: Entity, light: LightComponent)
	{
		const transform = this.world.getComponent(entity, Transform)!;
		if(!transform) return;

		if(this.backingLightObjects.has(light))
		{
			this.updateLight(light, this.backingLightObjects.get(light)!, transform);
			this.scene.object3d.add(this.backingLightObjects.get(light)!);
			return;
		}
		else
		{
			let threeLight: Three.Light;
			switch(true)
			{
				case light instanceof DirectionalLight:
				{
					threeLight = new Three.DirectionalLight(light.color, light.intensity);
					break;
				}
				case light instanceof PointLight:
				{
					threeLight = new Three.PointLight(light.color, light.intensity);
					break;
				}
				case light instanceof SpotLight:
				{
					threeLight = new Three.SpotLight(light.color, light.intensity);
					break;
				}
				case light instanceof HemisphereLight:
				{
					threeLight = new Three.HemisphereLight(light.skyColor, light.groundColor, light.intensity);
					break;
				}
				case light instanceof AmbientLight:
				{
					threeLight = new Three.AmbientLight(light.color, light.intensity);
					break;
				}
				default:
				{
					throw new Error("Unknown light type");
				}
			}
			this.backingLightObjects.set(light, threeLight);
			this.updateLight(light, threeLight, transform);
			this.scene.object3d.add(threeLight);
			const helper = new Three.PointLightHelper(threeLight as Three.PointLight, 2);
			this.scene.object3d.add(helper);
		}
	}

	private lightRemoved(entity: Entity, light: LightComponent)
	{
		if(!this.backingLightObjects.has(light)) return;
		const threeLight = this.backingLightObjects.get(light)!;
		this.scene.object3d.remove(threeLight);
		this.backingLightObjects.delete(light)
	}

	private updateLight(lightComponent: LightComponent, threeLight: Three.Light, transform: Transform)
	{
		threeLight.position.x = transform.posX;
		threeLight.position.y = transform.posY;
		threeLight.position.z = transform.posZ;
		threeLight.rotation.x = transform.rotX;
		threeLight.rotation.y = transform.rotY;
		threeLight.rotation.z = transform.rotZ;
		threeLight.scale.x = transform.scaleX;
		threeLight.scale.y = transform.scaleY;
		threeLight.scale.z = transform.scaleZ;

		if(lightComponent instanceof DirectionalLight)
		{
			(threeLight as Three.DirectionalLight).target.position.x = lightComponent.target.posX;
			(threeLight as Three.DirectionalLight).target.position.y = lightComponent.target.posY;
			(threeLight as Three.DirectionalLight).target.position.z = lightComponent.target.posZ;

			(threeLight as Three.DirectionalLight).intensity = lightComponent.intensity;
			(threeLight as Three.DirectionalLight).color = new Three.Color(lightComponent.color);
			(threeLight as Three.DirectionalLight).castShadow = lightComponent.castShadow;
		}

		if(lightComponent instanceof SpotLight)
		{
			(threeLight as Three.SpotLight).target.position.x = lightComponent.target.posX;
			(threeLight as Three.SpotLight).target.position.y = lightComponent.target.posY;
			(threeLight as Three.SpotLight).target.position.z = lightComponent.target.posZ;

			(threeLight as Three.SpotLight).intensity = lightComponent.intensity;
			(threeLight as Three.SpotLight).color = new Three.Color(lightComponent.color);
			(threeLight as Three.SpotLight).castShadow = lightComponent.castShadow;
		}

		if(lightComponent instanceof PointLight)
		{
			(threeLight as Three.PointLight).intensity = lightComponent.intensity;
			(threeLight as Three.PointLight).color = new Three.Color(lightComponent.color);
			(threeLight as Three.PointLight).castShadow = lightComponent.castShadow;
		}

		if(lightComponent instanceof HemisphereLight)
		{
			(threeLight as Three.HemisphereLight).intensity = lightComponent.intensity;
			(threeLight as Three.HemisphereLight).color = new Three.Color(lightComponent.skyColor);
			(threeLight as Three.HemisphereLight).groundColor = new Three.Color(lightComponent.groundColor);
		}

		if(lightComponent instanceof AmbientLight)
		{
			(threeLight as Three.AmbientLight).intensity = lightComponent.intensity;
			(threeLight as Three.AmbientLight).color = new Three.Color(lightComponent.color);
		}
	}

	private backingLightObjects: Map<LightComponent, Three.Light> = new Map;
}

/**
 * Manages entities with a MeshRenderer component.
 */
export class ThreeMeshSystem extends System
{
	override name = "ThreeMeshSystem";

	protected override onComponentAdded(entity: Entity, component: Component): void
	{

	}

	protected override onComponentRemoved(entity: Entity, component: Component): void
	{

	}
}
