function mapPredicate<K, V>(map: Map<K, V>, predicate: (key: K, value: V) => boolean): [K, V][]
{
	return Array.from(map).filter(([key, value]) => predicate(key, value) ? [key, value] : undefined).filter(Boolean) as [K, V][];
}

type Throws<T> = T;

/****************************************************************************************
 * Injection Keys
 *****************************************************************************************/

export class InjectionKey<T>{
	constructor(public brand: T = {} as T){}
}

type Constructor<T> = (new (...args: any[]) => T);
type AbstractConstructor<T> = abstract new (...args: any[]) => T;

type Key<T> = InjectionKey<T> | Constructor<T> | AbstractConstructor<T> | string | symbol;

/****************************************************************************************
 * Container
 *****************************************************************************************/

export class OutOfScopeError extends Error {}
export class ResolutionError extends Error {}

export class Container
{
	static current: Container | undefined;

	instances: Map<Key<any>, Constructor<any>> = new Map();
	singletons: Map<Key<any>, { instance: any; resolved: boolean; }> = new Map();
	values: Map<Key<any>, any> = new Map();

	registerTransient<K extends Key<any> | Constructor<any>, T extends Constructor<any>>(key: K | T, value?: T)
	{
		if(value)
		{
			this.instances.set(key, value);
		}
		else
		{
			this.instances.set(key, key as T);
		}
	}

	registerSingleton<K extends Key<any>, T extends Constructor<any>>(key: K | T, value?: T)
	{
		this.singletons.set(key, { instance: value ?? key, resolved: false });
	}

	registerValue<T>(key: Key<T>, value: T)
	{
		this.values.set(key, value);
	}

	#resolveTransient<T>(key: Key<T>): T | undefined
	{
		const instance = this.instances.get(key)
			|| mapPredicate(this.instances, (k) => typeof k === "function" && key instanceof k)[0]?.[1];
		if(instance){
			try {
				return new instance();
			} catch {
				throw new ResolutionError(`Could not resolve ${String(key)}`);
			}
		}
	}

	#resolveSingleton<T>(key: Key<T>): T | undefined
	{
		const singleton = this.singletons.get(key)
			|| mapPredicate(this.singletons, (k) => typeof k === "function" && key instanceof k)[0]?.[1];
		if(!singleton) return;
		if(!singleton.resolved){
			const instance = singleton.instance;
			singleton.instance = new instance();
			singleton.resolved = true;
		}
		return singleton.instance;
	}

	#resolveValue<T>(key: Key<T>): T | undefined
	{
		console.log(key, this.values)
		return this.values.get(key);
	}

	resolve<T>(key: Key<T>): T
	{
		const prev = Container.current;
		Container.current = this;
		try {
			const value = this.#resolveSingleton(key) ?? this.#resolveTransient(key) ?? this.#resolveValue(key);
			if(!value) throw new ResolutionError(`Could not resolve ${String(key)}`);
			return value;
		} finally {
			Container.current = prev;
		}
	}

	resolveSafe<T>(key: Key<T>): T | undefined
	{
		try {
			return this.resolve(key);
		} catch {
			return undefined;
		}
	}
}

export type Injected<T extends InjectionKey<T>> = T['brand'];

export function inject<T>(key: Key<T>): Throws<T>
{
	if(!Container.current) throw new OutOfScopeError('No container in scope');
	return Container.current.resolve(key);
}

export function injectSafe<T>(key: Key<T>): T | undefined
{
	if(!Container.current) return undefined;
	return Container.current.resolveSafe(key);
}