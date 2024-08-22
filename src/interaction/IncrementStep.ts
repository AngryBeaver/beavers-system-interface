//IncrementStep needs a text Field as description of what that is.
//just return success

class IncrementStep implements TestClass<"name"> {

    id= "IncrementStep";
    create(data:Record<"name",any>){
        const result = new IncrementStepCustomized();
        result.data = data;
        result.parent = this;
        return result;
    }

    readonly informationFields:InputField = {
        name: "type",
        type: "info",
        label: game['i18n'].localize("beaversSystemInterface.tests.incrementStep.label"),
        note: game['i18n'].localize("beaversSystemInterface.tests.incrementStep.note")
    }

    readonly customizationFields:{
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

    data:{name: undefined};

    public action = async (initiatorData: InitiatorData) => ({
        success: 1,
        fail: 0
    });

    public render = (data: any): string => {
        return data.name;
    };

}

beaversSystemInterface.registerTestClass(new IncrementStep());