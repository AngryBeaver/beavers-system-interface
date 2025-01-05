import {Settings} from "../Settings.js";

export class SelectDialog extends Application {
    selectData: SelectData
    callback;
    selected: string;

    static promise(data: SelectData) {
        return new Promise<string>((resolve) => {
            const keys = Object.keys(data.choices);
            if(keys.length === 1){
                resolve(keys[0]);
                return;
            }
            if(keys.length === 0){
                resolve("");
                return;
            }
            new SelectDialog(
                data,
                resolve
            ).render(true);
        });
    }

    constructor(data: SelectData , callback: (id: string | PromiseLike<string>) => void, options?: Partial<ApplicationOptions>) {
        super(options);
        this.selectData = data;
        this.callback = callback;
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            title: game["i18n"].localize(`beaversSystemInterface.select-dialog.title`),
            width: 300,
            height: 80,
            template: "modules/beavers-system-interface/templates/selectDialog.hbs",
            resizable: false,
            classes: ["select-dialog"],
            popOut: true
        });
    }

    getData() {
        return foundry.utils.mergeObject(this.selectData,{size:"l",enabled:Settings.get(Settings.ENABLE_SELECTION)});
    }

    activateListeners(html: JQuery) {
        html.find("select").on("input", () => {
            this.selected = html.find("select").val() as string;
            if (this.selected != "") {
                this.close();
            }
        })
        html.find("input").on("input", () => {
            const result = html.find("input").val() as string;
            this.selected = result;
            if (result != "") {
                this.close();
            }
        })
    }

    close(options?: Application.CloseOptions): Promise<void> {
        const result = super.close(options);
        this.callback(this.selected);
        return result;
    }


}

