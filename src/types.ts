interface SystemApi {
    version: number;
    id: string;
    init?:()=>Promise<void>;
    configSkills: SkillConfig[];
    configAbilities: AbilityConfig[];
    configCurrencies: CurrencyConfig[];
    configCanRollAbility: boolean;
    configLootItemType: string;
    actorRollSkill: (actor, skillId: string) => Promise<Roll|null>;
    actorRollAbility: (actor, abilityId: string) => Promise<Roll|null>;
    actorRollTool?: (actor,item) => Promise<Roll|null>;
    actorCurrenciesAdd?: (actor, currencies: Currencies) => Promise<void>; //deprecated
    actorCurrenciesGet?: (actor) => Currencies;
    actorCurrenciesStore?: (actor, currencies: Currencies) => Promise<void>;
    actorSheetAddTab:(sheet, html, actor, tabData: { id: string, label: string, html: string }, tabBody: string) => void;
    componentIsSame?:(a: ComponentData,b: ComponentData)=>boolean,
    componentFromEntity?:(entity,hasJsonData?:boolean)=>Component,
    componentDefaultData?: ComponentData,
    itemQuantityAttribute:string,
    itemPriceAttribute:string,
    itemSheetReplaceContent?:(app, html,element)=>void;
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
    actorComponentListAdd:(actor,componentList: Component[])=>Promise<ItemChange>,
    uuidToDocument: (string)=>Promise<foundry.abstract.Document<any, any>>
    componentCreate:(data) => Component
    componentDefaultData: ComponentData,
    componentFromEntity:(entity,hasJsonData?:boolean)=>Component,
    componentIsSame:(a: ComponentData,b: ComponentData)=>boolean,
    currenciesSum:(source: Currencies, add: Currencies, doExchange:boolean)=>Currencies
    objectAttributeGet:(obj:any, attribute:string, fallback?:any)=>any,
    objectAttributeSet:(obj:any, attribute:string, value)=>void,
    itemListComponentFind:(itemList,component: ComponentData)=>{components:Component[],quantity:number},
    tokenMovementCreate:(actorId:string)=>TokenMovementInstance,
    uiDialogSelect:(data: SelectData)=>Promise<string>
}

interface SelectData {
    choices:{
        [id:string]:{     //id of your choice
            text:string,  //text of your choice
            img?:string   //optional image of your choice
        }
    },
    selected?: string,    //id of preselection
    name?: string         //name of input for usage within form
    size?:string          //height of the selection default 20px size:l=30px
    disabled?:string      //simulates disabled
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
    jsonData?: string;      //to store a component completly
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
interface ItemChange {
    create: any[]
    update: any[],
    merge: string[],
    delete: ComponentData[]
}

interface TokenMovementInstance {
    move:(x:number,y:number)=>void
}