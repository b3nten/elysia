import { Scene } from "../core/scene.ts";
import { Scene as ThreeSceneImpl } from "three";
import { Sky as ThreeSky } from "three/examples/jsm/objects/Sky.js";
import * as Three from "three";

export class ThreeScene extends Scene {
    readonly threeRoot = new ThreeSceneImpl;

    get sky() {
        return this._sky
    }

    get environment() {
        return this._environment;
    }

    protected _sky = new Sky(this.threeRoot);
    protected _environment = new Environment;
}

class Sky {
    get enabled() {
        return this._enabled;
    }

    set enabled(v: boolean) {
        this._enabled = v;
        if (v) {
            this.parent.add(this.object3d);
            this._updateSunPosition();
        } else {
            this.parent.remove(this.object3d);
        }
    }

    get scale(): number {
        return this.object3d.scale.x;
    }

    set scale(v: number) {
        this.object3d.scale.setScalar(v);
    }

    get turbidity(): number {
        return this.object3d.material.uniforms.turbidity.value;
    }

    set turbidity(v: number) {
        this.object3d.material.uniforms.turbidity.value = v;
    }

    get rayleigh(): number {
        return this.object3d.material.uniforms.rayleigh.value;
    }

    set rayleigh(v: number) {
        this.object3d.material.uniforms.rayleigh.value = v;
    }

    get mieCoefficient(): number {
        return this.object3d.material.uniforms.mieCoefficient.value;
    }

    set mieCoefficient(v: number) {
        this.object3d.material.uniforms.mieCoefficient.value = v;
    }

    get mieDirectionalG(): number {
        return this.object3d.material.uniforms.mieDirectionalG.value;
    }

    set mieDirectionalG(v: number) {
        this.object3d.material.uniforms.mieDirectionalG.value = v;
    }

    get elevation(): number {
        return this._skyElevation
    }

    set elevation(v: number) {
        this._skyElevation = v;
        this._updateSunPosition();
    }

    get azimuth(): number {
        return this._skyAzimuth;
    }

    set azimuth(v: number) {
        this._skyAzimuth = v;
        this._updateSunPosition();
    }

    get hemiLight() {
        return this._skyHemiLight;
    }

    get dirLight() {
        return this._skyDirLight;
    }

    readonly object3d = new ThreeSky;

    constructor(
        protected parent: Three.Object3D
    ) {
        this.object3d.add(this._skyDirLight);
        this.object3d.add(this._skyHemiLight);
        this.object3d.scale.setScalar(450000);
    }

    protected _enabled = false;

    protected _skyElevation = 2;

    protected _skyAzimuth = 180;

    protected _sunPosition = new Three.Vector3;

    protected _skyDirLight: Three.DirectionalLight =
        new Three.DirectionalLight(0xffffff, 5);

    protected _skyHemiLight: Three.HemisphereLight =
        new Three.HemisphereLight(0xffffff, 0x444444);

    protected _updateSunPosition() {
        const phi = Three.MathUtils.degToRad(90 - this._skyElevation);
        const theta = Three.MathUtils.degToRad(this._skyAzimuth);
        this._sunPosition.setFromSphericalCoords(20, phi, theta);
        this.object3d.material.uniforms.sunPosition.value.copy(this._sunPosition);
        this._skyDirLight.position.copy(this._sunPosition);
        this._skyDirLight.updateMatrix();
        this.object3d.material.needsUpdate = true;
        this.object3d.matrixWorldNeedsUpdate = true;
    }
}

// todo: implement Environment
class Environment {

}