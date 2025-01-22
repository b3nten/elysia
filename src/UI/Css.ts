/**
 * Template literal tag function that can provide CSS syntax highlighting in certain IDE's.
 */
export default (
	strings: TemplateStringsArray,
	...values: unknown[]
): string => {
	return strings.map((str, i) => str + (values[i] || "")).join("");
};
