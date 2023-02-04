import {CoreSystem} from "./CoreSystem.js";
export const NAMESPACE = "beavers-system-interface";

Hooks.once('init', async function () {
    globalThis.beaversSystemInterface = new CoreSystem();
    if(!game[NAMESPACE])game[NAMESPACE]=beaversSystemInterface;
    Hooks.call("beavers-system-interface.init");
});

Hooks.on("ready",async function () {
    beaversSystemInterface.checkValidity();
    await beaversSystemInterface.init();
    Hooks.call("beavers-system-interface.ready");
});
