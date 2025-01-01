if(typeof HTMLElement === "undefined")
{
    // @ts-ignore
    globalThis.HTMLElement = class HTMLElement {}
}

if(typeof customElements === "undefined")
{
    // @ts-ignore
    globalThis.customElements = {
        define: function define(name, constructor) {
            // @ts-ignore
            globalThis[name] = constructor;
        },
        get: function get(name) {
            // @ts-ignore
            return globalThis[name];
        }
    }
}