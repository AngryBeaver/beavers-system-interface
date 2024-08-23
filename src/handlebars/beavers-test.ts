

export function registerHandleBars(){
    getTemplate('modules/beavers-system-interface/templates/beavers-input-field.hbs').then(template=>{
        Handlebars.registerHelper('beavers-test', function(serializedTest:SerializedTest<any>,options:TestRenderOptions){
            var test = beaversSystemInterface.testClasses[serializedTest.id] as TestClass<any>;
            var customizedHtml:string = `<span class="beavers-test">
                <input type="hidden" name="${options.prefixName}.id" value="${serializedTest.id}">`
            for (let [key,inputField] of Object.entries(test.customizationFields)) {
                let i:BeaversInputField = {...inputField as BeaversInputField}
                i.value = serializedTest.data[key];
                i.prefixName = options.prefixName+".data";
                customizedHtml += template(i);
            }
            return customizedHtml+"</span>";
        });


        Handlebars.registerHelper('beavers-test-options', function(value: string, name:string){
            let result={}
            for(let id in beaversSystemInterface.testClasses){
                let testClass = beaversSystemInterface.testClasses[id] as TestClass<any>;
                result[id] = {text:testClass.informationField.label}
            }
            const selection: BeaversInputField = {
                choices: result, label: "type", name: name, type: "selection", value: value
            }
            return template(selection);
        });
    });

    Handlebars.registerHelper('beavers-object', function(...args){
        let obj = {};
        for (let i = 0; i < args.length; i += 2) {
            let key = args[i];
            let value = args[i+1];
            if (key && value) {
                obj[key] = value;
            }
        }
        return obj;
    });


}