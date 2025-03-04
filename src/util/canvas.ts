import { EventDispatcher, createEvent } from "../events/mod.ts";
import { createWorker, workerMain, type WorkerProxy } from "./worker.ts";
import type { IDestructible } from "../core/lifecycle.ts";
import { isWorker } from "./asserts.ts";

export const CanvasResizeEvent = createEvent<{ x: number, y: number }>("elysiatech:CanvasObserver:resize");

export class CanvasObserver implements IDestructible {

    get width() {
        return this.#x;
    }

    get height() {
        return this.#y;
    }

    addWorker = (worker: Worker) => {
        if(isWorker()) {
            throw Error("Cannot add worker to CanvasObserver in a worker.");
        }
        let w = createWorker(worker);
        this.#workers.push(w);
        this.#cleanup.push(
            w.canvas[this.#id].getDimensions.$subscribe((_, sender) => {
                sender.canvas[this.#id].resize({
                    x: this.width,
                    y: this.height,
                });
            })
        );
    }

    sync = async () => {
        // return if main thread, as our data is already up to date
        if(!isWorker()) {
            return;
        }
        workerMain.canvas[this.#id].getDimensions(undefined);
        let { data } = await workerMain.canvas[this.#id].resize.$receive();
        this.#x = data.x;
        this.#y = data.y;
    }

    onResize = (callback: (args: { x: number, y: number }) => void) =>
        this.#eventDispatcher.addEventListener(CanvasResizeEvent, callback);

    constructor(
        id: string,
        canvas?: HTMLCanvasElement,
    ) {
        this.#id = id;
        if(isWorker()) {
            this.#initWorker();
        } else {
            this.#initMain(canvas ?? document.getElementById(id) as HTMLCanvasElement);
        }
    }

    destructor = () => {
        for(let d of this.#cleanup) d();
    }

    #eventDispatcher = new EventDispatcher;
    #workers: WorkerProxy[] = [];
    #id: string;
    #observer?: ResizeObserver;
    #cleanup: (() => void)[] = [];
    #x = 0;
    #y = 0;

    #initMain = (canvas: HTMLCanvasElement) => {
        const bounds = canvas.getBoundingClientRect();

        this.#x = bounds.width;
        this.#y = bounds.height;

        let hasSent = false;

        this.#observer = new ResizeObserver((entries) => {
            const cr = entries[0].contentRect;
            this.#x = cr.width;
            this.#y = cr.height;

            if(!hasSent) {
                hasSent = true;
                return;
            }

            this.#eventDispatcher.dispatchEvent(CanvasResizeEvent, {
                x: this.width,
                y: this.height,
            });

            for(let worker of this.#workers) {
                // Notify workers of resize
                worker.canvas[this.#id].resize({
                    x: this.width,
                    y: this.height,
                });
            }
        });

        this.#observer.observe(canvas);

        this.#cleanup.push(() => {
            this.#observer?.disconnect();
            this.#eventDispatcher.clear();
        });
    }

    #initWorker = () => {
        this.#cleanup.push(
            workerMain.canvas[this.#id].resize.$subscribe((args: { x: number, y: number }) => {
                this.#x = args.x;
                this.#y = args.y;
                this.#eventDispatcher.dispatchEvent(CanvasResizeEvent, {
                    x: this.width,
                    y: this.height,
                });
            })
        );
    }
}