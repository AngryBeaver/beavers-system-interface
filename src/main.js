import {CoreSystem} from "./CoreSystem.js";
export const NAMESPACE = "beavers-system-interface";

Hooks.once('init', async function () {
    globalThis.beaversSystemInterface = new CoreSystem();
    if(!game[NAMESPACE])game[NAMESPACE]=beaversSystemInterface;
    Hooks.call("BeaversSystemInterfaceLoaded");
});

Hooks.on("ready",async function () {
    beaversSystemInterface.checkValidity();
});
