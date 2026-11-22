
export class SkillTest implements TestClass<"skill"|"dc"> {
    public type:string =  "SkillTest"
    _choices:{[key:string]:{text:string, img?:string}} = {};
    constructor(){
        this._choices = beaversSystemInterface.configSkills.reduce((object, skill) => {
            object[skill.id] = { text: skill.label };
            return object;
        }, {})
    }
    public create(data:Record<"skill"|"dc",any>){
        const result = new SkillTestCustomized();
        result.data = data;
        result.parent = this;
        return result;
    }
    public informationField:InfoField = {
        name: "type",
        type: "info",
        label: (game as foundry.Game)['i18n'].localize("beaversSystemInterface.tests.skillTest.info.label"),
        note: (game as foundry.Game)['i18n'].localize("beaversSystemInterface.tests.skillTest.info.note")
    }

    get customizationFields(): Record<"dc"|"skill",InputField>{
        return {
            skill: {
                name: "skill",
                label: "skill",
                note: "Skill",
                type: "selection",
                choices: this._choices
            },
            dc: {
                name: "dc",
                label: "dc",
                note: "Difficulty Class ",
                defaultValue: 8,
                type: "number",
            }
        };
    }

}

class SkillTestCustomized implements Test<"skill"|"dc"> {

    parent: SkillTest
    data = {dc:8,skill:""}

    public action = async (initiatorData: InitiatorData):Promise<TestResult> => {
        const actor = beaversSystemInterface.initiator(initiatorData).actor;
        const roll = await beaversSystemInterface.actorRollSkill(actor,this.data.skill);
        if (!roll) {
            // roll dialog closed without rolling: nothing happens, the check can be rolled again
            return {success: 0, fail: 0};
        }
        return {
            success:roll.total>=this.data.dc?1:0,
            fail: roll.total<this.data.dc?1:0
        }
    }

    public render = (): string => {
        const skill = this.parent._choices[this.data.skill]?.text||"process";
        return `${skill}:dc ${this.data.dc}`;
    };

}

