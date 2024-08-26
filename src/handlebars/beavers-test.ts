export function registerHandleBars() {
    getTemplate('modules/beavers-system-interface/templates/beavers-input-field.hbs').then(template => {
        Handlebars.registerHelper('beavers-test', function (serializedTest: SerializedTest<any>, options: TestRenderOptions) {
            const testClass = beaversSystemInterface.testClasses[serializedTest.type] as TestClass<any>;
            let customizedHtml: string = `<span class="beavers-test">`
            if (!options.disabled) {
                customizedHtml = `${testOptions({...options, value : serializedTest.type})}`
                if (testClass != undefined) {
                    for (let [key, inputField] of Object.entries(testClass.customizationFields)) {
                        if (!options.disabled) {
                            let i: BeaversInputField = {...inputField as BeaversInputField}
                            i.value = serializedTest.data?.[key] || inputField.defaultValue
                            i.prefixName = options.prefixName + ".data";
                            i.minimized = options.minimized;
                            i.disabled = options.disabled;
                            customizedHtml += template(i);
                        }
                    }
                }
            } else if(testClass != undefined){
                const test = testClass.create(serializedTest.data);
                customizedHtml += test.render();
            }
            return customizedHtml + "</span>";
        });

        function testOptions(options: TestRenderOptions) {
            let result = {}
            for (let type in beaversSystemInterface.testClasses) {
                let testClass = beaversSystemInterface.testClasses[type] as TestClass<any>;
                result[type] = {text: testClass.informationField.label}
            }
            const selection: BeaversInputField = {
                choices: result,
                label: "type",
                prefixName: options.prefixName,
                name: "type",
                type: "selection",
                value: options.value
            }
            selection.disabled = options.disabled;
            selection.minimized = options.minimized;
            return "<span class='beavers-test-selection'>" + template(selection) + "</span>";
        }

        Handlebars.registerHelper('beavers-test-options', testOptions);
    });

    Handlebars.registerHelper('beavers-object', function (...args) {
        let obj = {};
        for (let i = 0; i < args.length; i += 2) {
            let key = args[i];
            let value = args[i + 1];
            if (key && value) {
                obj[key] = value;
            }
        }
        return obj;
    });

}