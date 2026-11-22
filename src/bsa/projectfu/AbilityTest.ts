export class AbilityTest implements TestClass<"primary" | "secondary" | "dc"> {

    public type = "AbilityTest";
    _choices: { [id: string]: { text: string, img?: string } } = {}

    constructor() {
        this._choices = beaversSystemInterface.configAbilities.reduce((object, ability) => {
            object[ability.id] = {text: ability.label};
            return object;
        }, {})
    }

    create(data: Record<"primary" | "secondary" | "dc", any>) {
        const result = new AbilityTestCustomized();
        result.data = data;
        result.parent = this;
        return result;
    }

    public informationField: InfoField = {
        name: "type",
        type: "info",
        label: (game as foundry.Game)['i18n'].localize("beaversSystemInterface.tests.abilityTest.info.label"),
        note: (game as foundry.Game)['i18n'].localize("beaversSystemInterface.tests.abilityTest.info.note")
    }

    public get customizationFields(): Record<"primary" | "secondary" | "dc", InputField> {
        return {
            primary: {
                name: "primary",
                label: "primary",
                note: "Primary",
                type: "selection",
                choices: this._choices
            },
            secondary: {
                name: "secondary",
                label: "secondary",
                note: "Secondary",
                type: "selection",
                choices: this._choices
            },
            dc: {
                name: "dc",
                label: "dc",
                note: "Difficulty Class ",
                defaultValue: 8,
                type: "number",
            }
        }
    }

}

var attributeCheck: any | null = null;
var openCheckPromise: Promise<any> | null = null;

async function loadOpenCheck(): Promise<any> {
    if (!openCheckPromise) {
        // If no existing Promise, load the module and cache it
        // @ts-ignore
        openCheckPromise = import('/systems/projectfu/module/checks/checks.mjs')
            .then((module) => {
                attributeCheck = module.Checks.attributeCheck;
                if(!attributeCheck){
                    throw new Error("attributeCheck not found");
                }
            })
            .catch((err) => {
                console.error('Error loading the module:', err);
                openCheckPromise = null; // Reset the promise cache on error
                throw err;
            });
    }
    return openCheckPromise;
}


async function waitForHook(timeout: number = 5000): Promise<{ roll: Roll }> {
    return new Promise((resolve, reject) => {
        // Create timeout promise
        const timeoutId = setTimeout(() => {
            reject(new Error(`Timeout reached: Hook "projectfu.processCheck" was not triggered within ${timeout}ms`));
        }, timeout);

        // Listen for the hook
        Hooks.once('projectfu.processCheck', (data, actor) => {
            clearTimeout(timeoutId); // Clear the timeout since hook was triggered
            resolve(data); // Resolve with the result provided by the hook
        });
    });
}

async function rollAbility(actor, primary, secondary) {
    await loadOpenCheck();
    const hookResultPromise = waitForHook();
    await attributeCheck(actor, {primary: primary, secondary: secondary});
    const result = await hookResultPromise;
    return result.roll.total || 0;
}

class AbilityTestCustomized implements Test<"primary" | "secondary" | "dc"> {

    parent: AbilityTest;

    data: Record<"primary" | "secondary" | "dc", any>

    public action = async (initiatorData: InitiatorData): Promise<TestResult> => {
        const actor = beaversSystemInterface.initiator(initiatorData).actor;
        const roll = await rollAbility(actor, this.data.primary, this.data.secondary);
        return {
            success: (roll >= (this.data.dc || 0)) ? 1 : 0,
            fail: (roll < (this.data.dc || 0)) ? 1 : 0
        }
    }

    public render = (): string => {
        const primary = this.parent._choices[this.data.primary]?.text || "process";
        const secondary = this.parent._choices[this.data.secondary]?.text || "process";
        return `${primary}-${secondary}:dc ${this.data.dc}`;
    };

}

