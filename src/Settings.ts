export class Settings {

    static NAMESPACE = "beavers-system-interface";
    public static ENABLE_SELECTION = "enableSelection";

    static init() {
        game["settings"].register(this.NAMESPACE, this.ENABLE_SELECTION, {
            name: game["i18n"].localize('beaversSystemInterface.settings.enableSelection.name'),
            hint: game["i18n"].localize('beaversSystemInterface.settings.enableSelection.hint'),
            scope: "user",
            config: true,
            default: true,
            type: Boolean,
        });
    }

    static get(key) {
        return game["settings"].get(this.NAMESPACE, key);
    };

    static set(key, value) {
        game["settings"].set(this.NAMESPACE, key, value);
    }

}