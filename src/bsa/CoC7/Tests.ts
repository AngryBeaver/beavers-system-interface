import type { CoC7 } from "./CoC7.js";
import { commonFields, countResult, levelLabel } from "./Check.js";

const i18n = () => (game as foundry.Game)["i18n"];
const coc7 = () => beaversSystemInterface["_implementation"] as CoC7;

function choicesOf(list: { id: string; label: string }[]): Record<string, { text: string }> {
  return list.reduce((object, entry) => {
    object[entry.id] = { text: entry.label };
    return object;
  }, {});
}

/** skill check: the skill must reach the required success level */
export class SkillTest implements TestClass<"skill" | "level" | "maxSuccesses"> {
  public type = "SkillTest";
  _choices: Record<string, { text: string }> = {};

  constructor() {
    this._choices = choicesOf(beaversSystemInterface.configSkills);
  }

  create(data: Record<"skill" | "level" | "maxSuccesses", any>) {
    const result = new SkillTestCustomized();
    result.data = data;
    result.parent = this;
    return result;
  }

  public informationField: InfoField = {
    name: "type",
    type: "info",
    label: i18n().localize("beaversSystemInterface.tests.skillTest.info.label"),
    note: i18n().localize("beaversSystemInterface.tests.skillTest.info.note"),
  };

  get customizationFields(): Record<"skill" | "level" | "maxSuccesses", InputField> {
    return {
      skill: { name: "skill", label: "skill", note: "Skill", type: "selection", choices: this._choices },
      ...commonFields(),
    };
  }
}

class SkillTestCustomized implements Test<"skill" | "level" | "maxSuccesses"> {
  parent: SkillTest;
  data = { skill: "", level: 1, maxSuccesses: 1 };

  public action = async (initiatorData: InitiatorData): Promise<TestResult> => {
    const actor = beaversSystemInterface.initiator(initiatorData).actor;
    const result = await coc7().rollSkill(actor, this.data.skill, Number(this.data.level) || 1);
    return countResult(result, this.data.level, this.data.maxSuccesses);
  };

  public render = (): string => {
    const skill = this.parent._choices[this.data.skill]?.text ?? this.data.skill;
    return `${skill}: ${levelLabel(this.data.level)}`;
  };
}

/** characteristic check (STR … EDU) or luck */
export class AbilityTest implements TestClass<"ability" | "level" | "maxSuccesses"> {
  public type = "AbilityTest";
  _choices: Record<string, { text: string }> = {};

  constructor() {
    this._choices = choicesOf(beaversSystemInterface.configAbilities);
  }

  create(data: Record<"ability" | "level" | "maxSuccesses", any>) {
    const result = new AbilityTestCustomized();
    result.data = data;
    result.parent = this;
    return result;
  }

  public informationField: InfoField = {
    name: "type",
    type: "info",
    label: i18n().localize("beaversSystemInterface.tests.abilityTest.info.label"),
    note: i18n().localize("beaversSystemInterface.tests.abilityTest.info.note"),
  };

  get customizationFields(): Record<"ability" | "level" | "maxSuccesses", InputField> {
    return {
      ability: { name: "ability", label: "characteristic", note: "Characteristic", type: "selection", choices: this._choices },
      ...commonFields(),
    };
  }
}

class AbilityTestCustomized implements Test<"ability" | "level" | "maxSuccesses"> {
  parent: AbilityTest;
  data = { ability: "", level: 1, maxSuccesses: 1 };

  public action = async (initiatorData: InitiatorData): Promise<TestResult> => {
    const actor = beaversSystemInterface.initiator(initiatorData).actor;
    const result = await coc7().rollAbility(actor, this.data.ability, Number(this.data.level) || 1);
    return countResult(result, this.data.level, this.data.maxSuccesses);
  };

  public render = (): string => {
    const ability = this.parent._choices[this.data.ability]?.text ?? this.data.ability;
    return `${ability}: ${levelLabel(this.data.level)}`;
  };
}

/**
 * Sanity check, e.g. for Mythos recipes: a SAN roll, a failure counts as a fail.
 * The sanity loss (dice formula) is taken through CoC7 (actor.loseSan), which also offers luck/talents to reduce it.
 */
export class SanityTest implements TestClass<"level" | "maxSuccesses" | "lossSuccess" | "lossFailure"> {
  public type = "SanityTest";

  create(data: Record<"level" | "maxSuccesses" | "lossSuccess" | "lossFailure", any>) {
    const result = new SanityTestCustomized();
    result.data = data;
    result.parent = this;
    return result;
  }

  public informationField: InfoField = {
    name: "type",
    type: "info",
    label: i18n().localize("beaversSystemInterface.tests.sanityTest.info.label"),
    note: i18n().localize("beaversSystemInterface.tests.sanityTest.info.note"),
  };

  get customizationFields(): Record<"level" | "maxSuccesses" | "lossSuccess" | "lossFailure", InputField> {
    return {
      ...commonFields(),
      lossSuccess: {
        name: "lossSuccess",
        label: "SAN loss success",
        note: "Sanity lost on a success (number or dice, e.g. 0)",
        defaultValue: "0",
        type: "text",
      },
      lossFailure: {
        name: "lossFailure",
        label: "SAN loss failure",
        note: "Sanity lost on a failure (number or dice, e.g. 1d4)",
        defaultValue: "1",
        type: "text",
      },
    };
  }
}

class SanityTestCustomized implements Test<"level" | "maxSuccesses" | "lossSuccess" | "lossFailure"> {
  parent: SanityTest;
  data = { level: 1, maxSuccesses: 1, lossSuccess: "0", lossFailure: "1" };

  public action = async (initiatorData: InitiatorData): Promise<TestResult> => {
    const actor: any = beaversSystemInterface.initiator(initiatorData).actor;
    const result = await coc7().rollAbility(actor, "san", Number(this.data.level) || 1);
    const counted = countResult(result, this.data.level, this.data.maxSuccesses);
    if (!result) return counted;
    const formula = String((counted.success > 0 ? this.data.lossSuccess : this.data.lossFailure) ?? "0").trim() || "0";
    try {
      const roll = await new Roll(formula).roll();
      const loss = Math.max(0, Math.floor(roll.total ?? 0));
      if (loss > 0) {
        if (!/^\d+$/.test(formula)) {
          await (roll as any).toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: i18n().localize("CoC7.SANLoss") });
        }
        await actor.loseSan(i18n().localize("beaversSystemInterface.tests.sanityTest.reason"), loss);
      }
    } catch (e) {
      console.error(`Beavers System Interface | CoC7 sanity loss "${formula}" failed`, e);
    }
    return counted;
  };

  public render = (): string => {
    return `${i18n().localize("CoC7.SAN")}: ${levelLabel(this.data.level)} (${this.data.lossSuccess ?? 0}/${this.data.lossFailure ?? 0})`;
  };
}
