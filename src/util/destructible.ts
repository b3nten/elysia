import guard from "../util/guard.ts";

let noop = () => void 0;

export class Destructible {
    static modifyPrototype = (type: any) => {
        if(type.__ELYSIADESTRUCTOR__MODIFIED__) {
            return;
        }

        let currentProto = Object.getPrototypeOf(type);

        while (currentProto !== null && currentProto !== Object.prototype) {
            if(Object.hasOwn(currentProto, "destructor")) {
                currentProto.__ELYSIADESTRUCTOR__ = currentProto.destructor;
                currentProto.destructor = noop;
            }
            currentProto = Object.getPrototypeOf(currentProto);
        }
    }

    static destroy = (instance: any) => {
        let currentProto = Object.getPrototypeOf(instance);

        while (currentProto !== null && currentProto !== Object.prototype) {
            if (Object.hasOwnProperty.call(currentProto, '__ELYSIADESTRUCTOR__') &&
                typeof currentProto.__ELYSIADESTRUCTOR__ === 'function') {
                guard(() => currentProto.__ELYSIADESTRUCTOR__.call(instance));
            }
            currentProto = Object.getPrototypeOf(currentProto);
        }
    }
}