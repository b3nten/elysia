// @ts-types="npm:@types/three@^0.169"
import * as Three from 'three';
import Rapier from "@dimforge/rapier3d-compat";

export class PhysicsDebugRenderer {
	mesh?: Three.LineSegments;
	world?: Rapier.World

	constructor(public enabled = true){}

	start(scene: Three.Scene, world: Rapier.World) {
		this.world = world
		this.mesh = new Three.LineSegments(new Three.BufferGeometry(), new Three.LineBasicMaterial({ color: 0xffffff, vertexColors: true }))
		this.mesh.frustumCulled = false
		scene.add(this.mesh)
	}

	update() {
		if (this.enabled) {
			if(!this.world) return
			const { vertices, colors } = this.world!.debugRender()
			this.mesh!.geometry.setAttribute('position', new Three.BufferAttribute(vertices, 3))
			this.mesh!.geometry.setAttribute('color', new Three.BufferAttribute(colors, 4))
			this.mesh!.visible = true
		} else {
			this.mesh!.visible = false
		}
	}
}