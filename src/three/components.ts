import { Component } from "../core/component.ts";
import * as Three from "three"
import { BoundingBox, BoundingSphere } from "../math/vectors.ts";
import { ThreeScene } from "./scene.ts";
import type {IBounded} from "../core/interfaces.ts";

export class CThreeObject<T extends Three.Object3D = Three.Object3D> extends Component implements IBounded {
    constructor(
        public object3d: T
    ) {
        super();
        this.object3d.matrixAutoUpdate = false;
        this.object3d.matrixWorldAutoUpdate = false;
        this.object3d.matrixWorld = this.parent.matrixWorld;
        this.object3d.userData.actor = this;
    }

    getBoundingBox() {
        return this._boundingBox;
    }

    getBoundingSphere() {
        return this._boundingSphere;
    }

    override onStartup() {
        ELYSIA_DEV: {
            if(!(this.scene instanceof ThreeScene)) {
                throw new Error("ThreeObject must be added to a ThreeScene");
            }
        }
        this.scene.threeRoot.add(this.object3d);
    }

    override onShutdown() {
        (this.scene as ThreeScene).threeRoot.remove(this.object3d);
    }

    override onTransformChanged() {
        this.parent.updateMatrices();
        this.parent.matrixWorld.decompose(
            this.object3d.position,
            this.object3d.quaternion,
            this.object3d.scale,
        );
        this.object3d.updateMatrix();
        this.object3d.updateMatrixWorld();
        this._boundingBox.setFromObject(this.object3d);
        this._boundingSphere.set(
            this.object3d.position,
            this._boundingBox.max.distanceTo(this._boundingBox.min) / 2
        )
    }

    protected _boundingBox = new BoundingBox;
    protected _boundingSphere = new BoundingSphere;
}

export class CThreePerspectiveCamera extends CThreeObject<Three.PerspectiveCamera> {

    get camera() {
        return this.object3d;
    }

    get aspect() {
        return this.camera.aspect;
    }

    set aspect(value: number) {
        this.camera.aspect = value;
    }

    get fov() {
        return this.camera.fov;
    }

    set fov(value: number) {
        this.camera.fov = value;
    }

    get near() {
        return this.camera.near;
    }

    set near(value: number) {
        this.camera.near = value;
    }

    get far() {
        return this.camera.far;
    }

    set far(value: number) {
        this.camera.far = value;
    }

    get zoom() {
        return this.camera.zoom;
    }

    set zoom(value: number) {
        this.camera.zoom = value;
    }

    get focus() {
        return this.camera.focus;
    }

    set focus(value: number) {
        this.camera.focus = value;
    }

    get filmGauge() {
        return this.camera.filmGauge;
    }

    set filmGauge(value: number) {
        this.camera.filmGauge = value;
    }

    get filmOffset() {
        return this.camera.filmOffset;
    }

    set filmOffset(value: number) {
        this.camera.filmOffset = value;
    }

    get lookAt() {
        return this.camera.lookAt;
    }

    get getFocalLength() {
        return this.camera.getFocalLength;
    }

    get setFocalLength() {
        return this.camera.setFocalLength;
    }

    get getEffectiveFOV() {
        return this.camera.getEffectiveFOV;
    }

    get getViewBounds() {
        return this.camera.getViewBounds;
    }

    constructor() {
        super(new Three.PerspectiveCamera);
    }
}

export class CThreeOrthographicCamera extends CThreeObject<Three.OrthographicCamera> {

    get camera() {
        return this.object3d;
    }

    get left() {
        return this.camera.left;
    }

    set left(value: number) {
        this.camera.left = value;
    }

    get right() {
        return this.camera.right;
    }

    set right(value: number) {
        this.camera.right = value;
    }

    get top() {
        return this.camera.top;
    }

    set top(value: number) {
        this.camera.top = value;
    }

    get bottom() {
        return this.camera.bottom;
    }

    set bottom(value: number) {
        this.camera.bottom = value;
    }

    get near() {
        return this.camera.near;
    }

    set near(value: number) {
        this.camera.near = value;
    }

    get far() {
        return this.camera.far;
    }

    set far(value: number) {
        this.camera.far = value;
    }

    get zoom() {
        return this.camera.zoom;
    }

    set zoom(value: number) {
        this.camera.zoom = value;
    }

    constructor() {
        super(new Three.OrthographicCamera);
    }
}

export class CThreeMesh {
    // TODO: Implement ThreeMesh
}