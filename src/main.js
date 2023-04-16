import {CoreSystem} from "./CoreSystem.js";
import {BeaversSelection} from "./elements/BeaversSelection.js";
import {Settings} from "./Settings.js";

export const NAMESPACE = "beavers-system-interface";

Hooks.once('init', async function () {
    Settings.init();
    globalThis.beaversSystemInterface = new CoreSystem();
    if(!game[NAMESPACE])game[NAMESPACE]=beaversSystemInterface;
    Hooks.call("beavers-system-interface.init");
});

Hooks.on("ready",async function () {
    beaversSystemInterface.checkValidity();
    await beaversSystemInterface.init();
    globalThis.selectionTemplate = await getTemplate('modules/beavers-system-interface/templates/select.hbs');
    customElements.define('beavers-selection',BeaversSelection);
    Hooks.call("beavers-system-interface.ready");
});

