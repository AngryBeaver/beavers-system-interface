import {CoreSystem} from "./CoreSystem.js";
import {BeaversSelection} from "./elements/BeaversSelection.js";
import {Settings} from "./Settings.js";
import {registerHandleBars} from "./handlebars/beavers-test.js";
import {getMyTemplate} from "./legacySupport.js";
import {builtinBsa, loadBsaCss} from "./bsa/index.js";

export const NAMESPACE = "beavers-system-interface";

Hooks.once('init', async function () {
    Settings.init();
    globalThis.beaversSystemInterface = new CoreSystem();
    if(!game[NAMESPACE])game[NAMESPACE]=beaversSystemInterface;
    // built-in adaptation first: separately installed bsa modules register in the hook below and are then ignored
    const bsa = builtinBsa(game.system.id);
    if (bsa) {
        beaversSystemInterface.registerBuiltin(bsa.create());
        loadBsaCss(NAMESPACE, bsa.system);
    }
    Hooks.call("beavers-system-interface.init");
});

Hooks.on("ready",async function () {
    beaversSystemInterface.checkValidity();
    await beaversSystemInterface.init();

    globalThis.selectionTemplate = getMyTemplate('modules/beavers-system-interface/templates/select.hbs');
    customElements.define('beavers-selection',BeaversSelection);
    // before the hook: bsa modules register their tests in it, the built-in ones must already be there to win
    for (const testClass of builtinBsa(game.system.id)?.testClasses() ?? []) {
        beaversSystemInterface.registerBuiltinTestClass(testClass);
    }
    Hooks.call("beavers-system-interface.ready");
    import("./interaction/IncrementStep.js");
    registerHandleBars();
});