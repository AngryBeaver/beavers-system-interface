## 2.2.2
- add Handlebar Partial beavers-input-field
- rename Handlebar Partial beavers-test-options -> beavers-test-selection
- add option renderType to Tests
## 2.2.1
- remove compatibility warnings for v14
## 2.2.0
- add modular Tests
## 2.1.10
- fixed wrong recommends id
- add all currently known bsa-x adaptions
- v12 ready
## 2.1.9
- fixed "Components did not copy over the nested flags correctly from source"
  - was using foundries helper setProperty which is not creating deep structures. -> using now objectAttributeSet
## 2.1.8
- own vtt-10 branch (eol)
## 2.1.7
- fix bug with asymmetric isSame implementations.
## 2.1.6
- add Module Extension for components
- allow asymmetric isSame implementations.
## 2.1.5
- refactor gamepad types to new beavers-gamepad npm package,
- update tokenMovementGamepadModule to beavers gamepad 2.0.0
- fix sensitivity for tokenMovementGamepadModule reduces possibility ot accidentally move diagonally.
## 2.1.4
- Add Beavers Token Movement smoothly move tokens while still snapping to grid.
Beavers Token Movement will also register as GamepadModule to beavers-gamepads.
## 2.1.3
- Fix submitting event "change" on beavers-selection
## 2.1.2
- Fix itemChange returning createdItems
- Fix objectAttributeGet will return fallback value when undefined
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
