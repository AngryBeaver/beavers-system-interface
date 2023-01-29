import {NAMESPACE} from "./main.js";

export class CoreSystem implements System {
    _implementation: SystemApi;
    _modules: string[] = [];
    _configCurrencies:CurrencyConfig[];

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

    async register(implementation) {
        if (implementation.id === game["system"].id) {
            this._implementation = implementation;
            await beaversSystemInterface.init();
        }
    }
    async init(){
        if (this._implementation?.init !== undefined) {
            await this._implementation.init();
        }
        const configCurrencies = beaversSystemInterface.configCurrencies;
        for(const currency of configCurrencies){
            if(currency.uuid != undefined){
                const currencyItem = await beaversSystemInterface.uuidToDocument();
                configCurrencies.component = beaversSystemInterface.componentFromEntity(currencyItem);
            }else{
                return;
            }
        }
        this._configCurrencies = configCurrencies;
    }

    get id(): string {
        return this._implementation.id;
    }

    get version(): number {
        return this._implementation.version;
    }

    get configSkills(): SkillConfig[] {
        if (this._implementation?.configSkills !== undefined) {
            return this._implementation.configSkills;
        } else {
            throw Error(game['i18n'].localize("beaversSystemInterface.MethodNotSupported") + ' configSkills');
        }
    }

    get configAbilities(): AbilityConfig[] {
        if (this._implementation?.configAbilities !== undefined) {
            return this._implementation.configAbilities;
        } else {
            throw Error(game['i18n'].localize("beaversSystemInterface.MethodNotSupported") + ' configAbilities');
        }
    }

    get configCurrencies(): CurrencyConfig[] {
        if(this._configCurrencies){
            return this._configCurrencies;
        }
        if (this._implementation?.configCurrencies !== undefined) {
            return this._implementation.configCurrencies;
        } else {
            throw Error(game['i18n'].localize("beaversSystemInterface.MethodNotSupported") + ' configCurrencies');
        }
    }

    get configCanRollAbility(): boolean {
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

    currenciesToLowestValue(currencies: Currencies): number {
        let result = 0;
        this.configCurrencies.forEach(currency => {
            result = result + ((currencies[currency.id] | 0) * currency.factor);
        })
        return result;
    }

    currencyToCurrencies(lowestValue: number): Currencies {
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

    actorRollAbility(actor, abilityId: string): Promise<any> {
        if (this._implementation?.actorRollAbility !== undefined) {
            return this._implementation.actorRollAbility(actor, abilityId);
        } else {
            throw Error(game['i18n'].localize("beaversSystemInterface.MethodNotSupported") + 'actorRollAbility');
        }
    }

    actorRollSkill(actor, skillId: string): Promise<any> {
        if (this._implementation?.actorRollSkill !== undefined) {
            return this._implementation.actorRollSkill(actor, skillId);
        } else {
            throw Error(game['i18n'].localize("beaversSystemInterface.MethodNotSupported") + 'actorRollSkill');
        }
    }

    actorCurrenciesGet(actor): Currencies {
        if (this._implementation?.actorCurrenciesGet !== undefined) {
            return this._implementation.actorCurrenciesGet(actor);
        } else {
            if(this._configCurrencies===undefined){
                throw Error(game['i18n'].localize("beaversSystemInterface.MethodNotSupported") + 'actorGetCurrencies');
            }
            const result:Currencies = {};
            beaversSystemInterface.configCurrencies.forEach(
                currency => {
                    const actorCurrencyComponent = beaversSystemInterface.actorComponentFind(actor,currency.component);
                    result[currency.id] = actorCurrencyComponent.quantity;
                }
            )
            return result;
        }
    }

    async actorCurrenciesAdd(actor, currencies: Currencies): Promise<void> {
        if (this._implementation?.actorCurrenciesAdd !== undefined) {
            return this._implementation.actorCurrenciesAdd(actor, currencies);
        } else {
            if(this._configCurrencies===undefined){
                throw Error(game['i18n'].localize("beaversSystemInterface.MethodNotSupported") + 'actorCurrenciesAdd');
            }
            const actorCurrencies = beaversSystemInterface.actorCurrenciesGet(actor);
            const actorValue = beaversSystemInterface.currenciesToLowestValue(actorCurrencies);
            const addValue = beaversSystemInterface.currenciesToLowestValue(currencies);
            const result = actorValue+addValue;
            if (result < 0) {
                throw new Error("negative money");
            }
            const resultCurrencies = beaversSystemInterface.currencyToCurrencies(result);
            actor = await fromUuid(actor.uuid);
            const deleteItems:string[] = []
            const createItems:any[] = [];
            //delete all previous currency items
            beaversSystemInterface.configCurrencies.forEach(
                currency => {
                    const actorCurrencyComponent = beaversSystemInterface.actorComponentFind(actor,currency.component);
                    if(actorCurrencyComponent.quantity > 0){
                        deleteItems.push(actorCurrencyComponent.id);
                    }
                }
            )
            //add currency
            for(const [key, value] of Object.entries(resultCurrencies)){
                const configCurrency = this.configCurrencies.find(c=>c.id === key);
                if(configCurrency === undefined){
                    throw new Error("currency" +key+ " not valid");
                }
                const item = await beaversSystemInterface.uuidToDocument(configCurrency.uuid);
                const itemData = item.toObject();
                itemData[beaversSystemInterface.itemQuantityAttribute] = value;
                if(itemData[beaversSystemInterface.itemQuantityAttribute] > 0) {
                    createItems.push(itemData);
                }
            }
            await actor.deleteEmbeddedDocuments("Item", deleteItems);
            await actor.createEmbeddedDocuments("Item", createItems);
        }

    }

    actorCurrenciesCanAdd(actor, currencies: Currencies): boolean {
        const actorCurrencies = this.actorCurrenciesGet(actor);
        const payValue = this.currenciesToLowestValue(currencies);
        const actorValue = this.currenciesToLowestValue(actorCurrencies);
        return 0 > actorValue + payValue;
    }

    actorSheetAddTab(sheet, html, actor, tabData: { id: string, label: string, html: string }, tabBody:string): void {
        if (this._implementation?.actorSheetAddTab !== undefined) {
            return this._implementation.actorSheetAddTab(sheet, html, actor, tabData, tabBody);
        } else {
            throw Error(game['i18n'].localize("beaversSystemInterface.MethodNotSupported") + 'actorSheetAddTab');
        }
    }

    actorComponentFind(actor, component: ComponentData): Component {
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

    async actorComponentListAdd(actor, componentList: Component[]): Promise<void> {
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
                    throw new Error("Beavers System Interface | remaining quantity on actor would be less then zero "+ component.name);
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
                    throw new Error("Beavers System Interface | remaining quantity on actor would be less then zero "+ component.name);
                }
                const entity = await component.getEntity();
                if (entity === null) {
                    throw new Error("Beavers System Interface | can not create Item " + component.name + " from " + component.uuid)
                }
                const data = entity.toObject();
                data[beaversSystemInterface.itemQuantityAttribute] = component.quantity;
                itemChange.create.push(data)
            }
        }
        await actor.createEmbeddedDocuments("Item", itemChange.create);
        await actor.updateEmbeddedDocuments("Item", itemChange.update);
        await actor.deleteEmbeddedDocuments("Item", itemChange.delete);
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
            return {
                id: "invalid",
                uuid: "invalid",
                img: "invalid",
                type: "invalid",
                name: "invalid",
                quantity: 1,
                itemType: undefined,
            }
        }
    }

    componentIsSame(a: ComponentData, b: ComponentData): boolean {
        if (this._implementation?.componentIsSame !== undefined) {
            return this._implementation.componentIsSame(a, b);
        } else {
            const isSameName = a.name === b.name;
            const isSameType = a.type === b.type;
            const isSameItemType = a.itemType === b.itemType;
            return isSameName && isSameType && isSameItemType;
        }
    }

    componentFromEntity(entity: any): Component {
        if (this._implementation?.componentFromEntity !== undefined) {
            return this._implementation.componentFromEntity(entity);
        } else {
            const data = {
                id: entity.id,
                uuid: entity.uuid,
                img: entity.img,
                name: entity.name,
                type : entity.documentName,
                quantity: entity[beaversSystemInterface.itemQuantityAttribute] || 1,
                itemType: entity.documentName === "Item" ? entity.type : undefined,
            }
            return beaversSystemInterface.componentCreate(data);
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

}