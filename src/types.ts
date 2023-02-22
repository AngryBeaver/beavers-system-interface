interface SystemApi {
    version: number;
    id: string;
    init?:()=>Promise<void>;
    configSkills: SkillConfig[];
    configAbilities: AbilityConfig[];
    configCurrencies: CurrencyConfig[];
    configCanRollAbility: boolean;
    configLootItemType: string;
    actorRollSkill: (actor, skillId: string) => Promise<Roll>;
    actorRollAbility: (actor, abilityId: string) => Promise<Roll>;
    actorRollTool?: (actor,item) => Promise<Roll>;
    actorCurrenciesGet?: (actor) => Currencies;
    actorCurrenciesAdd?: (actor, currencies: Currencies) => Promise<void>; //may throw Error
    actorSheetAddTab:(sheet, html, actor, tabData: { id: string, label: string, html: string }, tabBody: string) => void;
    componentIsSame?:(a: ComponentData,b: ComponentData)=>boolean,
    componentFromEntity?:(entity)=>Component,
    componentDefaultData?: ComponentData,
    itemQuantityAttribute:string,
    itemPriceAttribute:string,

}

interface System extends SystemApi {
    init?:()=>Promise<void>;
    checkValidity:()=>void;
    addModule:(name:string)=>void;
    register:(implementation:SystemApi)=>void;
    currenciesToLowestValue: (currencies: Currencies)=>number;
    currencyToCurrencies: (lowestValue: number)=>Currencies;
    actorCurrenciesGet: (actor) => Currencies;
    actorCurrenciesAdd: (actor, currencies: Currencies) => Promise<void>; //may throw Error
    actorCurrenciesCanAdd:(actor, currencies: Currencies)=>boolean;
    actorComponentListAdd:(actor,componentList: Component[])=>Promise<void>,
    uuidToDocument: (string)=>Promise<foundry.abstract.Document<any, any>>
    componentCreate:(data) => Component
    componentDefaultData: ComponentData,
    componentFromEntity:(entity)=>Component,
    componentIsSame:(a: ComponentData,b: ComponentData)=>boolean,
    objectAttributeGet:(obj:any, attribute:string)=>any,
    objectAttributeSet:(obj:any, attribute:string, value)=>void,
    itemListComponentFind:(itemList,component: ComponentData)=>{components:Component[],quantity:number},
    uiDialogSelect:(data: SelectData)=>Promise<string>
    onClickOutside:(selector:string|Element|JQuery,action:(selector:string|Element|JQuery)=>void)=>void
}

interface SelectData {
    choices:{
        [id:string]:{     //id of your choice
            text:string,  //text of your choice
            img?:string   //optional image of your choice
        }
    },
    selected?: string, //id of preselection
    input?: string //name of input for usage within form
    size?:"l"   //size of the selection height size:l = 30px height default 20px height
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
    component?: Component //will get automatically attached when an uuid is given
}
