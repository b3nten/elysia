import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Behavior } from "../Scene/Behavior.ts";
import { ELYSIA_LOGGER } from "../Core/Logger.ts";
import { isOrthographicCamera, isPerspectiveCamera } from "../Core/Asserts.ts";
import { PerspectiveCameraActor } from "../Actors/PerspectiveCameraActor.ts";
import { OrthographicCameraActor } from "../Actors/OrthographicCameraActor.ts";

/**
 * Implements the standard orbit controls for a camera.
 */
export class CameraOrbitBehavior extends Behavior
{
	override type = 'CameraOrbitBehavior';

	controls?: OrbitControls;

	/**
	 * Whether the camera should be damped smooth or not.
	 * @default false
	 */
	get smooth(): boolean { return this.controls?.enableDamping ?? false; }
	set smooth(value: boolean)
	{
		if(this.controls) this.controls.enableDamping = value;

		this.#smooth = value;
	}

	override onCreate()
	{
		super.onCreate();

		const camera = this.parent?.object3d;

		if(!camera)
		{
			ELYSIA_LOGGER.error("No camera found to attach orbit controls to", this.parent);
			return
		}

		if(!isPerspectiveCamera(camera) && !isOrthographicCamera(camera))
		{
			ELYSIA_LOGGER.error("Camera is not a Perspective or Orthographic camera", camera);
			return
		}

		this.controls = new OrbitControls(camera, this.app.renderPipeline.getRenderer().domElement);

		this.controls.enableDamping = this.#smooth;
	}

	override onUpdate()
	{
		if(this.controls)
		{
			this.controls.update();
		}
	}

	#smooth = false;
}
