export type RGB = [r: number, g: number, b: number];

export type Gradient = [start: RGB, end: RGB];

const purpleGradient: Gradient = [ [247, 81, 172], [55, 0, 231] ];
const sunsetGradient: Gradient = [ [231, 0, 187], [255, 244, 20] ];
const grayGradient: Gradient = [ [150,150,150], [69,69,69] ];
const orangeGradient: Gradient = [ [255, 147, 15], [255, 249, 91] ];
const limeGradient: Gradient = [ [89, 209, 2], [243, 245, 32] ];
const blueGradient: Gradient = [ [31, 126, 161], [111, 247, 232] ];
const redGradient: Gradient = [ [244, 7, 82], [249, 171, 143] ];

export const gradients = {
	purple: purpleGradient,
	sunset: sunsetGradient,
	gray: grayGradient,
	orange: orangeGradient,
	lime: limeGradient,
	blue: blueGradient,
	red: redGradient,
} as const;
