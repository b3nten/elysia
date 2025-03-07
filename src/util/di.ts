import { UNSAFE_isCtor } from "./asserts.ts";
import type { Constructor, AbstractConstructor } from "./types.ts";

type InjectResult<T> = T extends abstract new () => infer R ? R : never;

const DI_REGISTRY = new Map<
    Constructor<unknown>,
    AbstractConstructor<unknown>
>;

/**
 * Dependency injection container that supports both instances and constructors.
 * @example
 * ```ts
 * abstract class IService {
 *    abstract doSomething(): void;
 * }
 *
 * @injectable(IService)
 * class Service {
 *   doSomething() {
 *      console.log("Doing something");
 *   }
 * }
 *
 * let container = new Container;
 * container.set(new Service);
 *
 * let service = container.get(IService);
 * service.doSomething();
 * ```
 */
export class Container {
    constructor(
        protected _parent?: Container
    ) {}

    /**
     * Retrieves an instance from the container. If one does not exist but a constructor is registered,
     * a new instance is created and returned.
     * @param token
     */
    get<T extends Object>(token: AbstractConstructor<T> | Constructor<T>): T {
        let value = this._values.get(token) ?? this._recurseParent(token);

        if (value) {
            return value as T;
        }

        let ctor = this._ctors.get(token) ?? this._recurseParentCtor<T>(token);

        if (ctor) {
            let val = new ctor() as T;
            this.set(token, val);
            return val;
        }

        throw new Error(`No value found for token: ${String(token)}`);
    }

    /**
     * Sets instances and constructors in the container. If one is already registered
     * with the same token, it is overwritten.
     * @param instances
     */
    set(...instances: any[]) {
        for (let instance of instances) {
            if (typeof instance === "function") {
                let token = DI_REGISTRY.get(instance as Constructor<unknown>);
                if (token) {
                    if (UNSAFE_isCtor(instance)) {
                        this._ctors.set(token, instance);
                    }
                    else {
                        this._values.set(token, instance);
                    }
                }
                else {
                    throw new Error(
                        `No registered interface found for constructor: ${instance.toString()}. You probably forgot to use the @injectable decorator.`,
                    );
                }
            }
            else {
                let i = instance as Object;
                let token = i?.constructor as Constructor<unknown>;
                if (!token) {
                    throw new Error(`No constructor found for instance: ${i.toString()}`);
                }
                if (!DI_REGISTRY.has(token)) {
                    throw new Error(
                        `No registered interface found for constructor: ${token.toString()}. You probably forgot to use the @injectable decorator.`,
                    );
                }
                if (UNSAFE_isCtor(i)) {
                    this._ctors.set(DI_REGISTRY.get(token)!, i);
                }
                else {
                    this._values.set(DI_REGISTRY.get(token)!, i);
                }
            }
        }
    }

    /**
     * Retrieves a constructor from the container.
     * @param token
     */
    getCtor<T>(token: AbstractConstructor<T>): Constructor<T> | null {
        return (
            (this._ctors.get(token) as Constructor<T>) ??
            this._recurseParentCtor(token)
        );
    }

    protected _recurseParent<T extends Object>(
        token: AbstractConstructor<T>,
    ): T | null {
        if (this._parent)
        {
            return this._parent.get<T>(token);
        }
        return null;
    }

    protected _recurseParentCtor<T>(
        token: AbstractConstructor<T>,
    ): Constructor<T> | null {
        if (this._parent)
        {
            return this._parent.getCtor(token);
        }
        return null;
    }

    protected _values = new Map<AbstractConstructor<unknown>, Object>();

    protected _ctors = new Map<
        AbstractConstructor<unknown>,
        Constructor<unknown>
    >();
}

/**
 * Makes a class injectable.
 * If called without arguments, the class itself is used as the interface,
 * otherwise the argument is used as the interface.
 * @param key - The interface (abstract class) that the class implements.
 */
export function injectable<
    Key extends AbstractConstructor<unknown> | Constructor<unknown>,
>(key?: Key): <T extends new (...args: any[]) => InjectResult<Key>>(
    constructor: T
) => T {
    return <T extends new (...args: any[]) => InjectResult<Key>>(
        constructor: T,
    ): T => {
        DI_REGISTRY.set(constructor, key ?? constructor);
        return constructor;
    };
}
