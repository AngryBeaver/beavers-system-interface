interface SystemApi {
    version: number;
    id: string;
    configSkills: SkillConfig[];
    configAbilities: AbilityConfig[];
    configCurrencies: CurrencyConfig[];
    configCanRollAbility: boolean;
    configLootItemType: string;
    actorRollSkill: (actor, skillId: string) => Promise<any>;
    actorRollAbility: (actor, abilityId: string) => Promise<any>;
    actorGetCurrencies: (actor) => Currencies;
    actorAddCurrencies: (actor, currencies: Currencies) => Promise<void>; //may throw Error
    actorSheetAddTab:(sheet, html, actor, tabData: { id: string, label: string, html: string }, tabBody: JQuery) => void;
    componentIsSame:(a: ComponentData,b: ComponentData)=>boolean,
    componentFromEntity:(entity)=>Component,
    componentDefaultData?: ComponentData,
    itemQuantityAttribute:string,
    itemPriceAttribute:string,

}

interface System extends SystemApi {
    checkValidity:()=>void;
    addModule:(name:string)=>void;
    register:(implementation:SystemApi)=>void;
    currencyToLowestValue: (currencies: Currencies)=>number;
    currencyToCurrencies: (lowestValue: number)=>Currencies;
    actorCanAddCurrencies:(actor, currencies: Currencies)=>boolean;
    actorFindComponent:(actor,component: ComponentData)=>Component,
    actorAddComponentList:(actor,componentList: Component[])=>Promise<void>,
    uuidToDocument: (string)=>Promise<foundry.abstract.Document<any, any>>
    componentCreate:(data) => Component
    componentDefaultData: ComponentData,
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

interface SkillConfig {
    id: string,
    label: string,
    uuid?: string //system dependent if this is an item
}
interface AbilityConfig {
    id: string,
    label: string,
    uuid?: string //system dependent if this is an item
}
interface CurrencyConfig {
    id: string,
    label: string,
    factor: number, //factor how often the lowest currency fits into this currency
    uuid?: string, //system dependent if this is an item
    [key: string]: unknown; //this is system dependent information! do not rely on it. It maybe used for internal behavior.
}
