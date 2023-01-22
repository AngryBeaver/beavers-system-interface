interface SystemApi {
    version: number;
    id: string;
    configSkills: {
        id: string,
        label: string,
    }[];
    configAbilities: {
        id: string,
        label: string,
    }[];
    configCurrencies: {
        id: string,
        label: string,
        factor: number,
        img?: string,
    }[];
    actorRollSkill: (actor, skillId: string) => Promise<any>;
    actorRollAbility: (actor, rollId: string) => Promise<any>;
    actorGetCurrencies: (actor) => Currencies;
    actorAddCurrencies: (actor, currencies: Currencies) => Promise<boolean>;
    actorSheetAddTab:(sheet, html, actor, tabData: { id: string, label: string, html?: string }, tabBody: JQuery) => void;
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
    [key: string]: unknown;
}

/**
 * System independent presentation Currency values
 */
interface Currencies {
    [id: string]: number
}
