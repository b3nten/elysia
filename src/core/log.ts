// import { createLogger, LogLevel } from "../log/logger.ts";
//
// export let elysiaLogger = createLogger({
//     name: "Elysia",
//     level: LogLevel.Debug
// })
//
// export let SET_ELYSIA_LOGLVL = (level: LogLevel) => {
//     elysiaLogger.level = level;
// }
//
//
//
//
//
//
//











class Friend {
    foo = new Foo();

    logX() {
        console.log(this.foo.prototype)
    }
}

class Foo {
    static {

    }

    private x = 1;

    private logX() {
        console.log(this.x);
    }
}


new Friend().logX()


























