import { SET_ELYSIA_DEV } from "../src/Shared/Asserts.ts";

SET_ELYSIA_DEV(true);

document.body.style.width = "100%";
document.body.style.height = "100vh";
document.body.style.margin = "0";

import("./game.ts");
