import {NAMESPACE} from "./main.js";

export class CoreSystem implements System {
    _implementation: SystemApi;
    _modules: string[] = [];

    checkValidity() {
        if (this._modules.length > 0 && this._implementation === undefined) {
            // @ts-ignore
            ui.notifications.error("Beavers System Interface | " + game.system.id + " implementation for beavers system interface is missing");
            console.error("The following modules will not work", this._modules);
            throw Error(game['i18n'].localize("beaversSystemInterface.SystemNotFound"));
        }
    }

    addModule(name: string) {
        this._modules.push(name)
    }

    register(implementation) {
        if (implementation.id === game["system"].id) {
            implementation.parent = this;
            this._implementation = implementation;
        }
    }

    get id(): string {
        return this._implementation.id;
    }

    get version(): number {
        return this._implementation.version;
    }

    get configSkills() {
        if (this._implementation?.configSkills !== undefined) {
            return this._implementation.configSkills;
        } else {
            throw Error(game['i18n'].localize("beaversSystemInterface.MethodNotSupported") + ' configSkills');
        }
    }

    get configAbilities() {
        if (this._implementation?.configAbilities !== undefined) {
            return this._implementation.configAbilities;
        } else {
            throw Error(game['i18n'].localize("beaversSystemInterface.MethodNotSupported") + ' configAbilities');
        }
    }

    get configCurrencies() {
        if (this._implementation?.configCurrencies !== undefined) {
            return this._implementation.configCurrencies;
        } else {
            throw Error(game['i18n'].localize("beaversSystemInterface.MethodNotSupported") + ' configCurrencies');
        }
    }

    get configCanRollAbility():boolean {
        if (this._implementation?.configCanRollAbility !== undefined) {
            return this._implementation.configCanRollAbility;
        } else {
            throw Error(game['i18n'].localize("beaversSystemInterface.MethodNotSupported") + ' configCanRollAbility');
        }
    }
    get configLootItemType(): string {
        if (this._implementation?.configLootItemType !== undefined) {
            return this._implementation.configLootItemType;
        } else {
            throw Error(game['i18n'].localize("beaversSystemInterface.MethodNotSupported") + ' configLootItemType');
        }
    }

    currencyToLowestValue(currencies: Currencies) {
        let result = 0;
        this.configCurrencies.forEach(currency => {
            result = result + ((currencies[currency.id] | 0) * currency.factor);
        })
        return result;
    }

    currencyToCurrencies(lowestValue: number) {
        const sortedSystemCurrencies = this.configCurrencies.sort((a, b) => {
            if (a.factor < b.factor) {
                return 1;
            }
            if (a.factor > b.factor) {
                return -1
            }
            return 0;
        })
        const result = {};
        sortedSystemCurrencies.forEach(currency => {
            result[currency.id] = Math.floor(lowestValue / currency.factor);
            lowestValue = lowestValue - (result[currency.id] * currency.factor);
        });
        return result;
    }

    actorRollAbility(actor, abilityId: string) {
        if (this._implementation?.actorRollAbility !== undefined) {
            return this._implementation.actorRollAbility(actor, abilityId);
        } else {
            throw Error(game['i18n'].localize("beaversSystemInterface.MethodNotSupported") + 'actorRollAbility');
        }
    }

    actorRollSkill(actor, skillId: string) {
        if (this._implementation?.actorRollSkill !== undefined) {
            return this._implementation.actorRollSkill(actor, skillId);
        } else {
            throw Error(game['i18n'].localize("beaversSystemInterface.MethodNotSupported") + 'actorRollSkill');
        }
    }

    actorGetCurrencies(actor) {
        if (this._implementation?.actorGetCurrencies !== undefined) {
            return this._implementation.actorGetCurrencies(actor);
        } else {
            throw Error(game['i18n'].localize("beaversSystemInterface.MethodNotSupported") + 'actorGetCurrencies');
        }
    }

    actorAddCurrencies(actor, currencies: Currencies) {
        if (this._implementation?.actorAddCurrencies !== undefined) {
            return this._implementation.actorAddCurrencies(actor, currencies);
        } else {
            throw Error(game['i18n'].localize("beaversSystemInterface.MethodNotSupported") + 'actorPayCurrencies');
        }
    }

    actorCanAddCurrencies(actor, currencies: Currencies) {
        const actorCurrencies = this.actorGetCurrencies(actor);
        const payValue = this.currencyToLowestValue(currencies);
        const actorValue = this.currencyToLowestValue(actorCurrencies);
        return 0 > actorValue + payValue;
    }

    actorSheetAddTab(sheet, html, actor, tabData, tabBody) {
        if (this._implementation?.actorSheetAddTab !== undefined) {
            return this._implementation.actorSheetAddTab(sheet, html, actor, tabData, tabBody);
        } else {
            throw Error(game['i18n'].localize("beaversSystemInterface.MethodNotSupported") + 'actorSheetAddTab');
        }
    }

    actorFindComponent(actor, component: ComponentData): Component {
        const result = beaversSystemInterface.componentCreate(component);
        result.quantity = 0;
        actor.items.forEach((i) => {
            const componentItem = beaversSystemInterface.componentFromEntity(i);
            if (componentItem.isSame(component)) {
                result.quantity = result.quantity + componentItem.quantity;
            }
        });
        return result;
    }

    async actorAddComponentList(actor, componentList: Component[]): Promise<boolean> {
        //unique Components
        const uniqueComponents: Component[] = [];
        componentList.forEach(component => {
            const result = beaversSystemInterface.componentCreate(component);
            let exists = false;
            uniqueComponents.forEach(uniqueComponent => {
                if (uniqueComponent.isSame(component)) {
                    exists = true;
                    uniqueComponent.quantity = uniqueComponent.quantity + result.quantity;
                }
            });
            if (!exists) {
                uniqueComponents.push(beaversSystemInterface.componentCreate(component));
            }
        });
        //create ItemChange from unique components;
        const itemChange: {
            create: any[]
            update: any[],
            delete: string[]
        } = {
            create: [],
            update: [],
            delete: []
        }
        for (const component of uniqueComponents) {
            let exists = false;
            actor.items.forEach((i) => {
                const actorItem = beaversSystemInterface.componentFromEntity(i);
                if (actorItem.isSame(component)) {
                    if (!exists) {
                        component.id = actorItem.id;
                        component.quantity = component.quantity + actorItem.quantity;
                        exists = true;
                    } else {
                        component.quantity = component.quantity + actorItem.quantity;
                        itemChange.delete.push(actorItem.id);
                    }
                }
            });
            if (exists) {
                if (component.quantity < 0) {
                    return false;
                }
                if (component.quantity === 0) {
                    itemChange.delete.push(component.id);
                } else {
                    const update = {_id: component.id};
                    update[beaversSystemInterface.itemQuantityAttribute] = component.quantity;
                    itemChange.update.push(update);
                }
            } else {
                if (component.quantity < 0) {
                    return false;
                }
                const entity = await component.getEntity();
                if (entity === null) {
                    // @ts-ignore
                    ui.notifications.error("Beavers System Interface | can not create Item " + component.name + " from " + component.uuid);
                    return false
                }
                const data = entity.toObject();
                data[beaversSystemInterface.itemQuantityAttribute] = component.quantity;
                itemChange.create.push(data)
            }
        }
        await actor.createEmbeddedDocuments("Item", itemChange.create);
        await actor.updateEmbeddedDocuments("Item", itemChange.update);
        await actor.deleteEmbeddedDocuments("Item", itemChange.delete);
        return true;
    }


    async uuidToDocument(uuid: string): Promise<foundry.abstract.Document<any, any>> {
        const parts = uuid.split(".");
        let result: foundry.abstract.Document<any, any> | null = null;
        if (parts[0] === "Compendium") {
            const pack = game["packs"].get(parts[1] + "." + parts[2]);
            if (pack !== undefined) {
                result = await pack.getDocument(parts[3]);
            }
        } else {
            result = await fromUuid(uuid);
        }
        if (result === null) {
            throw new Error("document not found");
        }
        return result;
    }

    componentCreate(data: any): Component {
        const result = mergeObject(this.componentDefaultData, data, {insertKeys: false});
        result.getEntity = async () => {
            return game[NAMESPACE].uuidToDocument(result.uuid);
        }
        result.isSame = (component: ComponentData) => {
            return game[NAMESPACE].componentIsSame(result, component);
        }
        return result as Component;
    }

    get componentDefaultData(): ComponentData {
        if (this._implementation?.componentDefaultData !== undefined) {
            return this._implementation.componentDefaultData;
        } else {
            throw Error(game['i18n'].localize("beaversSystemInterface.MethodNotSupported") + 'componentDefaultData');
        }
    }

    componentIsSame(a: ComponentData, b: ComponentData): boolean {
        if (this._implementation?.componentIsSame !== undefined) {
            return this._implementation.componentIsSame(a, b);
        } else {
            throw Error(game['i18n'].localize("beaversSystemInterface.MethodNotSupported") + 'componentIsSame');
        }
    }

    componentFromEntity(entity: any): Component {
        if (this._implementation?.componentFromEntity !== undefined) {
            return this._implementation.componentFromEntity(entity);
        } else {
            throw Error(game['i18n'].localize("beaversSystemInterface.MethodNotSupported") + 'componentFromEntity');
        }
    }

    get itemQuantityAttribute(): string {
        if (this._implementation?.itemQuantityAttribute !== undefined) {
            return this._implementation.itemQuantityAttribute;
        } else {
            throw Error(game['i18n'].localize("beaversSystemInterface.MethodNotSupported") + 'itemQuantityAttribute');
        }
    }

    get itemPriceAttribute(): string {
        if (this._implementation?.itemQuantityAttribute !== undefined) {
            return this._implementation.itemQuantityAttribute;
        } else {
            throw Error(game['i18n'].localize("beaversSystemInterface.MethodNotSupported") + 'itemQuantityAttribute');
        }
    }

    itemListAddComponentList(itemList: any[], componentList: ComponentData[]): ComponentData[] {
        if (this._implementation?.itemListAddComponentList !== undefined) {
            return this._implementation.itemListAddComponentList(itemList, componentList);
        } else {
            throw Error(game['i18n'].localize("beaversSystemInterface.MethodNotSupported") + 'itemListAddComponentList');
        }
    }


}