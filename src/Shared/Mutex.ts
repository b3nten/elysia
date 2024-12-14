const MUTEX_LOCKED = 1;
const MUTEX_UNLOCKED = 0;

export class Mutex
{
    /**
     * Check if SharedArrayBuffer is supported.
     */
    static get SupportsSharedArrayBuffer()
    {
        return typeof window !== "undefined" && globalThis.isSecureContext && globalThis.crossOriginIsolated
    }

    /**
     * Instantiate a Mutex connected to the given one.
     * @param {Mutex} mutex the other Mutex.
     */
    static Connect(mutex: Mutex)
    {
        return new Mutex(mutex.backingArrayBuffer);
    }

    backingArrayBuffer: SharedArrayBuffer | ArrayBuffer;

    /**
     * Instantiate Mutex.
     * If backingArrayBuffer is provided, the mutex will use it as a backing array.
     * @param backingArrayBuffer
     */
    constructor(backingArrayBuffer?: SharedArrayBuffer | ArrayBuffer)
    {
        this.backingArrayBuffer = backingArrayBuffer || Mutex.SupportsSharedArrayBuffer ? new SharedArrayBuffer(4) : new ArrayBuffer(4);
        this.#value = new Int32Array(this.backingArrayBuffer);
    }

    lock() {
        for(;;) {
            if (Atomics.compareExchange(this.#value, 0, MUTEX_UNLOCKED, MUTEX_LOCKED) == MUTEX_UNLOCKED)
            {
                return;
            }
            Atomics.wait(this.#value, 0, MUTEX_LOCKED);
        }
    }

    unlock() {
        if (Atomics.compareExchange(this.#value, 0, MUTEX_LOCKED, MUTEX_UNLOCKED) != MUTEX_LOCKED) {
            throw new Error("Mutex is in inconsistent state: unlock on unlocked Mutex.");
        }
        Atomics.notify(this.#value, 0, 1);
    }

    #value: Int32Array;
}