import * as Three from 'three';

export interface ThreeMaterialBase extends Three.Material {

}

export class ThreeShaderMaterial extends Three.ShaderMaterial implements ThreeMaterialBase {

}

export class ThreeMeshBasicMaterial extends Three.MeshBasicMaterial implements ThreeMaterialBase {
    constructor(parameters?: Three.MeshBasicMaterialParameters) {
        super(parameters);
    }
}

export class ThreeMeshStandardMaterial extends Three.MeshStandardMaterial implements ThreeMaterialBase {
    constructor(parameters?: Three.MeshStandardMaterialParameters) {
        super(parameters);
    }
}

export class ThreeMeshPhysicalMaterial extends Three.MeshPhysicalMaterial implements ThreeMaterialBase {
    constructor(parameters?: Three.MeshPhysicalMaterialParameters) {
        super(parameters);
    }
}