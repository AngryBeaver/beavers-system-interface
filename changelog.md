## 2.1.1
- allow null values for rolls to indicate rollabort

## 2.1.0
- Add: itemSheetReplaceContent?:(app, html,element)=>void;

## 2.0.0
- Fix quantity zero
- change: objectAttributeGet has now optional fallback parameter
- change: actorComponentListAdd will now return ItemChange
- change: componentData may now have the original ItemData stored
- breaking bsa.x componentFromEntity has now an additional parameter "hasJsonData"
- new currenciesSum:(source: Currencies, add: Currencies, doExchange:boolean)=>Currencies
- breaking bsa.x actorAddCurrencies is gone and now replaced by actorStoreCurrencies and should now longer sumUp the currencies.

## 1.1.1
- Add compatibility to v11

## 1.1.x
- Add CustomElement `<beavers-selection>`
- Add uiDialogSelect
- Add `actorRollItem: (actor,item) => Promise<Roll>`;
- Fix actorRollSkill returns now `Promise<Roll>` instead of `Promise<any>`
- Fix actorRollAbility returns now `Promise<Roll>` instead of `Promise<any>`

## 1.0.7
Fix objectAttributeGet will return undefined if object is undefined on any subpath of the attribute string instead of throwing an exception.
