interface SystemApi {
    version: number;
    id: string;
    configSkills: {
        id: string,
        label: string,
        uuid?: string //system dependent if this is an item
    }[];
    configAbilities: {
        id: string,
        label: string,
        uuid?: string //system dependent if this is an item
    }[];
    configCurrencies: {
        id: string,
        label: string,
        factor: number
        uuid?: string //system dependent if this is an item
        [key: string]: unknown; //this is system dependent information! do not relay on it. It is only needed for internal behavior.
    }[];
    configCanRollAbility: boolean;
    configLootItemType: string;
    actorRollSkill: (actor, skillId: string) => Promise<any>;
    actorRollAbility: (actor, rollId: string) => Promise<any>;
    actorGetCurrencies: (actor) => Currencies;
    actorAddCurrencies: (actor, currencies: Currencies) => Promise<boolean>; //may throw Error
    actorSheetAddTab:(sheet, html, actor, tabData: { id: string, label: string, html: string }, tabBody: JQuery) => void;
    componentDefaultData: ComponentData,
    componentIsSame:(a: ComponentData,b: ComponentData)=>boolean,
    componentFromEntity:(entity)=>Component,
    itemQuantityAttribute:string,
    itemPriceAttribute:string,
    itemListAddComponentList:(itemList:any[],componentList:ComponentData[])=>ComponentData[],
}

interface System extends SystemApi {
    checkValidity:()=>void;
    addModule:(name:string)=>void;
    register:(implementation:SystemApi)=>void;
    currencyToLowestValue: (currencies: Currencies)=>number;
    currencyToCurrencies: (lowestValue: number)=>Currencies;
    actorCanAddCurrencies:(actor, currencies: Currencies)=>boolean;
    actorFindComponent:(actor,component: ComponentData)=>Component,
    actorAddComponentList:(actor,componentList: Component[])=>Promise<boolean>,
    uuidToDocument: (string)=>Promise<foundry.abstract.Document<any, any>>
    componentCreate:(data) => Component
}

/**
 * System independent presentation of an Object
 */
interface Component extends ComponentData{
    isSame: (component:ComponentData)=>boolean
    getEntity: ()=>Promise<any>
}

/**
 * System independent presentation of an Object
 */
interface ComponentData {
    id: string
    uuid: string;
    type: string;
    name: string;
    img: string;
    quantity: number;
    itemType?: string;      //if it is of type item there is an itemType
    [key: string]: unknown; //this is system dependent information! do not relay on it. It is only needed for internal behavior e.g. isSame.

}

/**
 * System independent presentation Currency values
 */
interface Currencies {
    [id: string]: number
}
