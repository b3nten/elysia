// @ts-types="npm:@types/three@^0.169.0"
import * as Three from 'three';
import { Behavior } from "../Core/Behavior.ts";

export class FirstPersonCamera extends Behavior
{
	isLocked = false;

	domElement?: HTMLElement;

	sensitivity = 0.002;

	get target() { return this.parent }

	constructor() {
		super();
		this.static = true;
		this.onConnect = this.onConnect.bind(this);
		this.onDisconnect = this.onDisconnect.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
		this.onPointerLockChange = this.onPointerLockChange.bind(this);
		this.onPointerLockError = this.onPointerLockError.bind(this);
		this.lock = this.lock.bind(this);
		this.unlock = this.unlock.bind(this);
	}

	override onCreate()
	{
		this.domElement = this.app!.renderPipeline.getRenderer().domElement
		this.onConnect();
	}

	onConnect()
	{
		this.domElement?.ownerDocument.addEventListener( 'mousemove', this.onMouseMove );
		this.domElement?.ownerDocument.addEventListener( 'pointerlockchange', this.onPointerLockChange );
		this.domElement?.ownerDocument.addEventListener( 'pointerlockerror', this.onPointerLockError );
		this.domElement?.addEventListener( 'click', () => this.lock() );
	}

	onDisconnect()
	{
		this.domElement?.ownerDocument.removeEventListener( 'mousemove', this.onMouseMove );
		this.domElement?.ownerDocument.removeEventListener( 'pointerlockchange', this.onPointerLockChange );
		this.domElement?.ownerDocument.removeEventListener( 'pointerlockerror', this.onPointerLockError );
	}

	onMouseMove = (event: MouseEvent) =>
	{
		if (!this.enabled || !this.isLocked || !this.parent || !this.parent) return;

		const movementX = event.movementX ?? 0;
		const movementY = event.movementY ?? 0;

		this.euler.y -= movementX * this.sensitivity;
		this.euler.x -= movementY * this.sensitivity;
		this.euler.x = Math.min(Math.max(this.euler.x, -1.0472), 1.0472);

		this.target.rotation.setFromEuler(this.euler);
	}

	onPointerLockChange = (event: Event) => this.isLocked = this.domElement?.ownerDocument.pointerLockElement === this.domElement;

	onPointerLockError = (event: Event) => console.error(event)

	lock() { this.domElement?.requestPointerLock(); }

	unlock() { this.domElement?.ownerDocument.exitPointerLock(); }

	override destructor() {
		super.destructor();
		this.onDisconnect();
	}

	private euler = new Three.Euler(0, 0, 0, 'YXZ');
}
