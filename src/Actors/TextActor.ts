/**
 * An actor that wraps Troika's Text.
 *
 * See https://protectwise.github.io/troika/troika-3d/text/ for more information.
 */

// @ts-types="npm:@types/three@^0.169"
import * as Three from 'three';
// @ts-ignore
import { Text} from 'troika-three-text'
import { OverrideMaterialManager } from 'postprocessing'
import { Actor } from "../Scene/Actor.ts";

export type TextActorConstructorArguments = {
	text: string
	color?: number | string
	fontSize?: number
	maxWidth?: number
	lineHeight?: number
	letterSpacing?: number
	textAlign?: 'left' | 'right' | 'center' | 'justify'
	font?: string
	anchorX?: number | 'left' | 'center' | 'right'
	anchorY?: number | 'top' | 'top-baseline' | 'middle' | 'bottom-baseline' | 'bottom'
	clipRect?: [number, number, number, number]
	depthOffset?: number
	direction?: 'auto' | 'ltr' | 'rtl'
	overflowWrap?: 'normal' | 'break-word'
	whiteSpace?: 'normal' | 'overflowWrap' | 'nowrap'
	outlineWidth?: number | string
	outlineOffsetX?: number | string
	outlineOffsetY?: number | string
	outlineBlur?: number | string
	outlineColor?: number | string
	outlineOpacity?: number
	strokeWidth?: number | string
	strokeColor?: number | string
	strokeOpacity?: number
	fillOpacity?: number
	sdfGlyphSize?: number
	debugSDF?: boolean
}

export class TextActor extends Actor<Text>
{
	get text(): any { return this.object3d.text }
	set text(val: any) { this.object3d.text = val; this.object3d.sync(); }

	get color(): Three.Color { return this.object3d.color }
	set color(val: any) { this.object3d.color = val; this.object3d.sync(); }

	get fontSize(): any { return this.object3d.fontSize }
	set fontSize(val: any) { this.object3d.fontSize = val; this.object3d.sync(); }

	get maxWidth(): any { return this.object3d.maxWidth }
	set maxWidth(val: any) { this.object3d.maxWidth = val; this.object3d.sync(); }

	get lineHeight(): any { return this.object3d.lineHeight }
	set lineHeight(val: any) { this.object3d.lineHeight = val; this.object3d.sync(); }

	get letterSpacing(): any { return this.object3d.letterSpacing }
	set letterSpacing(val: any) { this.object3d.letterSpacing = val; this.object3d.sync(); }

	get textAlign(): any { return this.object3d.textAlign }
	set textAlign(val: any) { this.object3d.textAlign = val; this.object3d.sync(); }

	get font(): any { return this.object3d.font }
	set font(val: any) { this.object3d.font = val; this.object3d.sync(); }

	get anchorX(): any { return this.object3d.anchorX }
	set anchorX(val: any) { this.object3d.anchorX = val; this.object3d.sync(); }

	get anchorY(): any { return this.object3d.anchorY }
	set anchorY(val: any) { this.object3d.anchorY = val; this.object3d.sync(); }

	get clipRect(): any { return this.object3d.clipRect }
	set clipRect(val: any) { this.object3d.clipRect = val; this.object3d.sync(); }

	get depthOffset(): any { return this.object3d.depthOffset }
	set depthOffset(val: any) { this.object3d.depthOffset = val; this.object3d.sync(); }

	get direction(): any { return this.object3d.direction }
	set direction(val: any) { this.object3d.direction = val; this.object3d.sync(); }

	get overflowWrap(): boolean { return this.object3d.overflowWrap }
	set overflowWrap(val: boolean) { this.object3d.overflowWrap = val; this.object3d.sync(); }

	get whiteSpace(): boolean { return this.object3d.whiteSpace }
	set whiteSpace(val: boolean) { this.object3d.whiteSpace = val; this.object3d.sync(); }

	get outlineWidth(): number { return this.object3d.outlineWidth }
	set outlineWidth(val: number) { this.object3d.outlineWidth = val; this.object3d.sync(); }

	get outlineOffsetX(): number { return this.object3d.outlineOffsetX }
	set outlineOffsetX(val: number) { this.object3d.outlineOffsetX = val; this.object3d.sync(); }

	get outlineOffsetY(): number { return this.object3d.outlineOffsetY }
	set outlineOffsetY(val: number) { this.object3d.outlineOffsetY = val; this.object3d.sync(); }

	get outlineBlur(): number { return this.object3d.outlineBlur }
	set outlineBlur(val: number) { this.object3d.outlineBlur = val; this.object3d.sync(); }

	get outlineColor(): Three.Color { return this.object3d.outlineColor }
	set outlineColor(val: Three.Color) { this.object3d.outlineColor = val; this.object3d.sync(); }

	get outlineOpacity(): number { return this.object3d.outlineOpacity }
	set outlineOpacity(val: number) { this.object3d.outlineOpacity = val; this.object3d.sync(); }

	get strokeWidth(): number { return this.object3d.strokeWidth }
	set strokeWidth(val: number) { this.object3d.strokeWidth = val; this.object3d.sync(); }

	get strokeColor(): Three.Color { return this.object3d.strokeColor }
	set strokeColor(val: Three.Color) { this.object3d.strokeColor = val; this.object3d.sync(); }

	get strokeOpacity(): number { return this.object3d.strokeOpacity }
	set strokeOpacity(val: number) { this.object3d.strokeOpacity = val; this.object3d.sync(); }

	get fillOpacity(): number { return this.object3d.fillOpacity }
	set fillOpacity(val: number) { this.object3d.fillOpacity = val; this.object3d.sync(); }

	get sdfGlyphSize(): number { return this.object3d.sdfGlyphSize }
	set sdfGlyphSize(val: number) { this.object3d.sdfGlyphSize = val; this.object3d.sync(); }

	get debugSDF(): boolean { return this.object3d.debugSDF }
	set debugSDF(val: boolean) { this.object3d.debugSDF = val; this.object3d.sync(); }

	loaded = false;

	constructor(props: TextActorConstructorArguments)
	{
		super();
		this.object3d = new Text();
		Object.assign(this.object3d, {
			font: "https://fonts.gstatic.com/s/kodemono/v2/A2BLn5pb0QgtVEPFnlYkkaoBgw4qv9odq5my9Do.ttf",
			sdfGlyphSize: 64,
			anchorX: 'center',
			anchorY: 'middle',
			fontSize: .2,
			...props
		})
		this.object3d.sync();
		OverrideMaterialManager.workaroundEnabled = true
	}
}
