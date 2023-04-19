import {NAMESPACE} from "./main.js";
import {SelectDialog} from "./apps/SelectDialog.js";

export class CoreSystem implements System {
    _version: number =  2
    _implementation: SystemApi;
    _modules: string[] = [];
    _configCurrencies:CurrencyConfig[];

    checkValidity() {
        if (this._modules.length > 0 && this._implementation === undefined) {
            // @ts-ignore
            ui.notifications.error("Beavers System Interface | missing module BSA - " + game.system.id + " <a href='https://github.com/AngryBeaver/beavers-system-interface/wiki/BSA-x-links'>module links</a>",{permanent:true});
            console.error("The following modules will not work", this._modules);
            throw Error(game['i18n'].localize("beaversSystemInterface.SystemNotFound"));
        }
    }

    addModule(name: string) {
        this._modules.push(name)
    }

    register(implementation) {
        if (implementation.id === game["system"].id) {
            this._implementation = implementation;
        }
    }
    async init(){
        if (this._implementation?.init !== undefined) {
            await this._implementation.init();
        }
        const configCurrencies = beaversSystemInterface.configCurrencies;
        for(const currency of configCurrencies){
            if(currency.uuid != undefined){
                const currencyItem = await beaversSystemInterface.uuidToDocument(currency.uuid);
                currency.component = beaversSystemInterface.componentFromEntity(currencyItem);
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

    actorRollAbility(actor, abilityId: string): Promise<Roll|null> {
        if (this._implementation?.actorRollAbility !== undefined) {
            return this._implementation.actorRollAbility(actor, abilityId);
        } else {
            throw Error(game['i18n'].localize("beaversSystemInterface.MethodNotSupported") + 'actorRollAbility');
        }
    }

    actorRollSkill(actor, skillId: string): Promise<Roll|null> {
        if (this._implementation?.actorRollSkill !== undefined) {
            return this._implementation.actorRollSkill(actor, skillId);
        } else {
            throw Error(game['i18n'].localize("beaversSystemInterface.MethodNotSupported") + 'actorRollSkill');
        }
    }

    actorRollTool(actor, item): Promise<Roll|null> {
        if (this._implementation?.actorRollTool !== undefined) {
            return this._implementation.actorRollTool(actor, item);
        } else {
            throw Error(game['i18n'].localize("beaversSystemInterface.MethodNotSupported") + 'actorRollTool');
        }
    }

    actorCurrenciesGet(actor): Currencies {
        if (this._implementation?.actorCurrenciesGet !== undefined) {
            return this._implementation.actorCurrenciesGet(actor);
        } else {
            if(this._configCurrencies===undefined){
                throw Error(game['i18n'].localize("beaversSystemInterface.MethodNotSupported") + 'actorGetCurrencies');
            }
            return this._actorCurrenciesGet(actor);
        }
    }

    _actorCurrenciesGet(actor): Currencies {
        const result:Currencies = {};
        beaversSystemInterface.configCurrencies.forEach(
            currency => {
                const actorFindings = beaversSystemInterface.itemListComponentFind(actor.items,currency.component);
                result[currency.id] = actorFindings.quantity;
            }
        )
        return result;
    }

    currenciesSum(source: Currencies, add: Currencies, doExchange:boolean):Currencies{
        if (doExchange) {
            return this._currenciesSumExchange(source,add);
        }else{
            return this._currenciesSumExact(source,add)
        }
    }

    _currenciesSumExchange(source: Currencies, add: Currencies): Currencies{
        const actorValue = beaversSystemInterface.currenciesToLowestValue(source);
        const addValue = beaversSystemInterface.currenciesToLowestValue(add);
        const result = actorValue + addValue;
        if (result < 0) {
            throw new Error(game['i18n'].localize("beaversSystemInterface.NotEnoughMoney"));
        }
        return beaversSystemInterface.currencyToCurrencies(result);
    }
    _currenciesSumExact(source: Currencies, add: Currencies):Currencies{
        let resultCurrencies = {};
        for(const [key, value] of Object.entries(add)){
            const sum = source[key] + value;
            if(sum< 0){
                throw new Error(game['i18n'].localize("beaversSystemInterface.NotEnoughMoney"));
            }
            resultCurrencies[key] = sum;
        }
        return resultCurrencies;
    }

    async actorCurrenciesAdd(actor, currencies: Currencies, doExchange:boolean = true): Promise<void> {
        if (this._implementation?.actorCurrenciesAdd !== undefined) {
            if(doExchange){
                console.warn("actorCurrenciesAdd is deprecated plz upgrade your bsa-x module");
            }else{
                ui.notifications?.error(game['i18n'].localize("beaversSystemInterface.VersionsMismatch"));
                throw Error(game['i18n'].localize("beaversSystemInterface.VersionsMismatch"));
            }
            return await this._implementation.actorCurrenciesAdd(actor, currencies);
        }
        const actorCurrencies = beaversSystemInterface.actorCurrenciesGet(actor);
        let resultCurrencies = this.currenciesSum(actorCurrencies,currencies,doExchange);
        if (this._implementation?.actorCurrenciesStore !== undefined) {
            return await this._implementation.actorCurrenciesStore(actor, resultCurrencies);
        } else {
            if(this._configCurrencies===undefined){
                throw Error(game['i18n'].localize("beaversSystemInterface.MethodNotSupported") + 'actorCurrenciesAdd');
            }
            await this._actorStoreCurrency(actor, resultCurrencies);
        }
    }

    async _actorStoreCurrency(actor, resultCurrencies: Currencies): Promise<void> {
        actor = await fromUuid(actor.uuid);
        const deleteItems:string[] = []
        const createItems:any[] = [];
        //delete all previous currency items
        beaversSystemInterface.configCurrencies.forEach(
            currency => {
                const actorFindings = beaversSystemInterface.itemListComponentFind(actor.items,currency.component);
                if(actorFindings.quantity > 0){
                    deleteItems.push(...actorFindings.components.map(c=>c.id));
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
            this.objectAttributeSet(itemData,beaversSystemInterface.itemQuantityAttribute,value);
            if(value as number > 0) {
                createItems.push(itemData);
            }
        }
        await actor.deleteEmbeddedDocuments("Item", deleteItems);
        await actor.createEmbeddedDocuments("Item", createItems);
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

    itemSheetReplaceContent(app, html, element):void{
        if (this._implementation?.itemSheetReplaceContent !== undefined) {
            return this._implementation.itemSheetReplaceContent(app, html, element);
        } else {
            html.find(".sheet-body").empty();
            html.find(".sheet-body").append(element);
        }
    }

    itemListComponentFind(itemList,component: ComponentData):{components:Component[],quantity:number} {
        const result = {
            quantity:0,
            components:[] as Component[]
        }
        itemList.forEach((i) => {
            const componentItem = beaversSystemInterface.componentFromEntity(i);
            if (componentItem.isSame(component)) {
                result.components.push(componentItem);
                result.quantity = result.quantity + componentItem.quantity;
            }
        });
        return result;
    }

    async actorComponentListAdd(actor, componentList: Component[]): Promise<ItemChange> {
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
        const itemChange:ItemChange = {
            create: [],
            update: [],
            merge: [],
            delete: []
        }
        for (const component of uniqueComponents) {
            const actorFindings = beaversSystemInterface.itemListComponentFind(actor.items,component);
            if(actorFindings.quantity != 0){
                component.quantity = component.quantity + actorFindings.quantity;
                if (component.quantity < 0) {
                    throw new Error("Beavers System Interface | "+game['i18n'].localize("beaversSystemInterface.RemainingQuantityLessThenZero")+ component.name);
                }
                if (component.quantity > 0) {
                    const update = {_id: actorFindings.components.shift().id};
                    this.objectAttributeSet(update,beaversSystemInterface.itemQuantityAttribute,component.quantity);
                    itemChange.update.push(update);
                }
                if (actorFindings.components[0]){
                    const entity = await actorFindings.components[0].getEntity();
                    component.jsonData = entity.toObject()
                    itemChange.delete.push(component);
                }
                itemChange.merge.push(...actorFindings.components.map(c => c.id));
            } else {
                if (component.quantity < 0) {
                    throw new Error("Beavers System Interface | "+game['i18n'].localize("beaversSystemInterface.RemainingQuantityLessThenZero")+ component.name);
                }
                if(component.quantity !=0) {
                    const entity = await component.getEntity();
                    const data = entity.toObject();
                    this.objectAttributeSet(data, beaversSystemInterface.itemQuantityAttribute, component.quantity);
                    itemChange.create.push(data)
                }
            }
        }
        await actor.createEmbeddedDocuments("Item", itemChange.create);
        await actor.updateEmbeddedDocuments("Item", itemChange.update);
        await actor.deleteEmbeddedDocuments("Item", itemChange.merge);
        return itemChange;
    }


    async uuidToDocument(uuid: string): Promise<foundry.abstract.Document<any, any>> {
        const parts = uuid.split(".");
        let result: foundry.abstract.Document<any, any> | null = null;
        if (parts[0] === "Compendium") {
            const pack = game["packs"].get(parts[1] + "." + parts[2]);
            if (pack !== undefined) {
                let id = parts[3];
                if(parts.length >= 5){
                    id = parts[4];
                }
                result = await pack.getDocument(id);
            }
        } else {
            result = await fromUuid(uuid);
        }
        if (result === null) {
            throw new Error("Beavers System Interface | "+game['i18n'].localize("beaversSystemInterface.DocumentNotFound")+ uuid);
        }
        return result;
    }

    componentCreate(data: any): Component {
        const result = mergeObject(this.componentDefaultData, data, {insertKeys: false});
        result.getEntity = async () => {
            if (result.jsonData) {
                if (result.type === "Item") {
                    return Item["fromSource"](result.jsonData);
                }
                if (result.type === "RollTable") {
                    return RollTable["fromSource"](result.jsonData);
                }
            }
            return beaversSystemInterface.uuidToDocument(result.uuid);
        }
        result.isSame = (component: ComponentData) => {
            return beaversSystemInterface.componentIsSame(result, component);
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
                jsonData: undefined
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

    componentFromEntity(entity: any, hasJsonData: boolean = false): Component {
        if (this._implementation?.componentFromEntity !== undefined) {
            if(this._implementation.version < 2){
                ui.notifications?.error(game['i18n'].localize("beaversSystemInterface.VersionsMismatch"));
                throw Error(game['i18n'].localize("beaversSystemInterface.VersionsMismatch"));
            }
            return this._implementation.componentFromEntity(entity,hasJsonData);
        } else {
            const data = {
                id: entity.id,
                uuid: entity.uuid,
                img: entity.img,
                name: entity.name,
                type : entity.documentName,
                quantity: this.objectAttributeGet(entity,beaversSystemInterface.itemQuantityAttribute,1),
                itemType: entity.documentName === "Item" ? entity.type : undefined,
                jsonData: hasJsonData? entity.toObject() : undefined
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

    objectAttributeGet(obj:any, attribute:string,fallback:any):any {
        const arr:string[] = attribute.split(".");
        while(arr.length){
            const prop = arr.shift();
            if(prop != undefined && prop !== ""){
                obj = obj[prop]
            }
            if(obj === undefined){
                return undefined;
            }
        }
        return obj;
    }

    objectAttributeSet(obj:any, attribute:string, value):void {
        const arr:string[] = attribute.split(".");
        while(arr.length){
            const prop = arr.shift();
            if(prop != undefined && prop != ""){
                if(obj[prop] == undefined){
                    obj[prop]={}
                }
                if(arr.length === 0){
                    obj[prop]=value;
                }
                obj = obj[prop];
            }
        }
    }

    async uiDialogSelect(data: SelectData):Promise<string> {
        return SelectDialog.promise(data);
    }

}