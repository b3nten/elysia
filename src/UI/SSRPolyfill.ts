if(typeof HTMLElement === "undefined")
{
    globalThis.HTMLElement = class HTMLElement {}
}

if(typeof customElements === "undefined")
{
    globalThis.customElements = {
        define: function define(name, constructor) {
            globalThis[name] = constructor;
        },
        get: function get(name) {
            return globalThis[name];
        }
    }
}