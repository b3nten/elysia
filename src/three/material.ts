import * as Three from "three";

export interface ThreeMaterialBase extends Three.Material {}

export class ThreeShaderMaterial
	extends Three.ShaderMaterial
	implements ThreeMaterialBase {}

export class ThreeMeshBasicMaterial
	extends Three.MeshBasicMaterial
	implements ThreeMaterialBase
{
}

export class ThreeMeshStandardMaterial
	extends Three.MeshStandardMaterial
	implements ThreeMaterialBase
{
}

export class ThreeMeshPhysicalMaterial
	extends Three.MeshPhysicalMaterial
	implements ThreeMaterialBase
{
}
