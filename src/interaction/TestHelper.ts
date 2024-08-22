
//Test layers:
//UserInteractionLayer:
// -> shows what a user see when interacting with it.
//CustomizationLayer:
// -> shows what a dm sees when setting it up.
//InterfaceLayer:
// -> shows what a developer needs to implement to create such sort of Test.
// -> -> Any Test needs to implement
// -> -> an action that returns a number of successes and fails
// -> -> -> often this is exactly one success or one fail.
// -> -> customizationFields

export class TestHelper {

    async renderTest(test: Test<any>){
        var customizedHtml:string = "<span class='fieldSection'>";
        var inputFieldTemplate
            = await getTemplate('modules/beavers-system-interface/templates/beavers-input-field.hbs');
        for (let [key,inputField] of Object.entries(test.customizationFields)) {
            customizedHtml += inputFieldTemplate({...inputField,value:test.data[key]});
        }
        return customizedHtml+"</span>";
    }
}

