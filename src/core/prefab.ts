export let definePrefab = <
    Resources extends Record<string, any>,
    Arguments extends any[],
    Output,
>(
    factory: (resources: Resources, ...restArgs: Arguments) => Output,
    resources: () => Resources,
): (...args: Arguments) => Output => {
    let r: Resources;
    return (...args: Arguments) => {
        if (!r) r = resources();
        return factory(r, ...args);
    };
}
