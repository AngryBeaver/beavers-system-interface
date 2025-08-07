
export class Settings {

    static NAMESPACE = "beavers-system-interface";
    public static ENABLE_SELECTION :ClientSettings.Key = "enableSelection";

    static init() {
        // @ts-ignore
        (game as foundry.Game)["settings"].register(this.NAMESPACE, this.ENABLE_SELECTION, {
            name: (game as foundry.Game)["i18n"].localize('beaversSystemInterface.settings.enableSelection.name'),
            hint: (game as foundry.Game)["i18n"].localize('beaversSystemInterface.settings.enableSelection.hint'),
            scope: "client",
            config: true,
            default: true,
            // @ts-ignore
            type: Boolean,
        });
    }

    static get(key) {
        // @ts-ignore
        return (game as foundry.Game)["settings"].get(this.NAMESPACE, key);
    };

    static set(key, value) {
        // @ts-ignore
        (game as foundry.Game).settings.set(this.NAMESPACE, key, value);
    }

}