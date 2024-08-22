export function registerHandleBars(){
    getTemplate('modules/beavers-system-interface/templates/beavers-input-field.hbs').then(t=>{
        Handlebars.registerHelper('beavers-test', function(serializedTest:SerializedTest<any>,options:TestRenderOptions){
            var test = beaversSystemInterface.testClasses[serializedTest.type]();
            var customizedHtml:string = `<span class="beavers-test">
                <input type="hidden" name="${options.prefixName}.type" value="${serializedTest.type}">`
            for (let [key,inputField] of Object.entries(test.customizationFields)) {
                let i:BeaversInputField = {...inputField as BeaversInputField}
                i.value = test.data[key];
                i.prefixName = options.prefixName+".data";
                customizedHtml += t(i);
            }
            return customizedHtml+"</span>";
        })
    });
}