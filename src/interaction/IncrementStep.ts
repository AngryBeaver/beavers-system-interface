//IncrementStep needs a text Field as description of what that is.
//just return success

class IncrementStep implements TestClass<"name"> {

    type= "IncrementStep";
    create(data:Record<"name",any>){
        const result = new IncrementStepCustomized();
        result.data = data;
        result.parent = this;
        return result;
    }

    readonly informationField:InfoField = {
        name: "type",
        type: "info",
        label: game['i18n'].localize("beaversSystemInterface.tests.incrementStep.info.label"),
        note: game['i18n'].localize("beaversSystemInterface.tests.incrementStep.info.note")
    }

    readonly customizationFields: Record<"name",InputField> = {
        name: {
            name: "name",
            label: "Description",
            note: "Enter a description for that test",
            defaultValue: "Killed a skeleton",
            type: "text",
        }
    }

}


class IncrementStepCustomized implements Test<"name"> {

    parent: IncrementStep;

    data:{name: ""};

    public action = async (initiatorData: InitiatorData) => ({
        success: 1,
        fail: 0
    });

    public render = (): string => {
        return this.data.name;
    };

}

beaversSystemInterface.registerTestClass(new IncrementStep());