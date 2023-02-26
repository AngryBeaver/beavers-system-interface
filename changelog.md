## 1.1.x
- Add CustomElement `<beavers-selection>`
- Add uiDialogSelect
- Add `actorRollItem: (actor,item) => Promise<Roll>`;
- Fix actorRollSkill returns now `Promise<Roll>` instead of `Promise<any>`
- Fix actorRollAbility returns now `Promise<Roll>` instead of `Promise<any>`

## 1.0.7
Fix objectAttributeGet will return undefined if object is undefined on any subpath of the attribute string instead of throwing an exception.
