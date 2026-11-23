/**
 * CoC7 checks are rolled through CoC7 itself: its roll dialog (bonus/penalty dice, difficulty) and its chat card.
 * CoC7's check methods do not return the result, it is read back from the chat card with game.CoC7.messageResults.
 */

/** CoC7 success levels (CoC7DicePool.successLevel) */
export const LEVEL = { fumble: -99, failure: 0, regular: 1, hard: 2, extreme: 3, critical: 4 };

/** the level a check must reach, offered in the recipe; the value is CoC7's difficulty level */
export function levelChoices(): Record<string, { text: string }> {
  const i18n = (game as foundry.Game)["i18n"];
  return {
    "1": { text: i18n.localize("CoC7.RegularDifficulty") },
    "2": { text: i18n.localize("CoC7.HardDifficulty") },
    "3": { text: i18n.localize("CoC7.ExtremeDifficulty") },
  };
}

export function levelLabel(level: any): string {
  return levelChoices()[String(level)]?.text ?? String(level);
}

export interface CheckResult {
  successLevel: number;
  isFumble: boolean;
}

/** the common fields of all CoC7 checks */
export function commonFields(): Record<"level" | "maxSuccesses", InputField> {
  return {
    level: {
      name: "level",
      label: "level",
      note: "Required success",
      type: "selection",
      choices: levelChoices(),
    },
    maxSuccesses: {
      name: "maxSuccesses",
      label: "max successes",
      note: "1: a success counts once. Higher: every success level above the required one counts once more, up to this.",
      defaultValue: 1,
      type: "number",
    },
  };
}

/**
 * Successes and fails of a check:
 * - below the required level (or a fumble): 1 fail
 * - otherwise 1 success plus one for each level above the required one, at most maxSuccesses
 */
export function countResult(result: CheckResult | null, level: any, maxSuccesses: any): TestResult {
  if (!result) return { success: 0, fail: 0 }; // roll dialog closed without rolling: the check can be rolled again
  const required = Number(level) || LEVEL.regular;
  if (result.isFumble || result.successLevel < required) return { success: 0, fail: 1 };
  const max = Math.max(1, Math.floor(Number(maxSuccesses) || 1));
  return { success: Math.min(max, 1 + result.successLevel - required), fail: 0 };
}

function successLevelOf(r: any): number {
  if (r.isFumble) return LEVEL.fumble;
  if (r.isCritical) return LEVEL.critical;
  if (r.isExtremeSuccess) return LEVEL.extreme;
  if (r.isHardSuccess) return LEVEL.hard;
  if (r.isRegularSuccess) return LEVEL.regular;
  return LEVEL.failure;
}

/** how long a roll may take after CoC7's roll dialog was closed until its chat card is there */
const AFTER_DIALOG_MS = 5000;
/** a GM roll on standby (CoC7 setting "standby GM rolls") is only rolled when the card is revealed */
const MAX_WAIT_MS = 10 * 60 * 1000;

/**
 * Runs a CoC7 check of the actor and resolves with its result, or null when the roll dialog was closed without rolling.
 * @param start starts the check, e.g. () => actor.skillCheck(name, false, {difficulty})
 */
export function rollCheck(actor: any, start: () => Promise<any>): Promise<CheckResult | null> {
  return new Promise((resolve) => {
    const g = game as foundry.Game;
    let done = false;
    let messageId: string | null = null;
    const hooks: [string, number][] = [];
    const timers: number[] = [];
    const finish = (result: CheckResult | null) => {
      if (done) return;
      done = true;
      hooks.forEach(([hook, id]) => Hooks.off(hook, id));
      timers.forEach((t) => window.clearTimeout(t));
      resolve(result);
    };
    const read = async (message: any) => {
      try {
        const results = await g["CoC7"].messageResults(message);
        const r = results?.[0];
        if (!r?.isRolled) return; // standby: wait for the card to be rolled
        finish({ successLevel: successLevelOf(r), isFumble: !!r.isFumble });
      } catch (e) {
        console.error("Beavers System Interface | CoC7 check result could not be read", e);
        finish(null);
      }
    };
    const isOurs = (message: any) => {
      const load = message.flags?.CoC7?.load;
      return load?.as === "CoC7Check" && load.actorUuid === actor.uuid;
    };
    hooks.push([
      "createChatMessage",
      Hooks.on("createChatMessage", (message: any, options: any, userId: string) => {
        if (messageId || userId !== g["user"].id || !isOurs(message)) return;
        messageId = message.id;
        read(message);
      }),
    ]);
    hooks.push([
      "updateChatMessage",
      Hooks.on("updateChatMessage", (message: any) => {
        if (message.id === messageId) read(message);
      }),
    ]);
    // the roll dialog is a DialogV2 with the class "bonus-selection": closed without a chat card means cancelled
    hooks.push([
      "closeApplicationV2",
      Hooks.on("closeApplicationV2", (app: any) => {
        if (!app.options?.classes?.includes("bonus-selection")) return;
        timers.push(window.setTimeout(() => !messageId && finish(null), AFTER_DIALOG_MS));
      }),
    ]);
    let dialogSeen = false;
    hooks.push([
      "renderApplicationV2",
      Hooks.on("renderApplicationV2", (app: any) => {
        if (app.options?.classes?.includes("bonus-selection")) dialogSeen = true;
      }),
    ]);
    timers.push(window.setTimeout(() => finish(null), MAX_WAIT_MS));
    start()
      .then(() => {
        // CoC7 may stop before its roll dialog, e.g. a specialization skill whose specialization was not chosen
        timers.push(window.setTimeout(() => !dialogSeen && !messageId && finish(null), AFTER_DIALOG_MS));
      })
      .catch((e) => {
        console.error("Beavers System Interface | CoC7 check failed", e);
        finish(null);
      });
  });
}

/** a Roll whose total is the CoC7 success level (fumble -1, failure 0, regular 1, hard 2, extreme 3, critical 4) */
export async function toRoll(result: CheckResult | null): Promise<Roll | null> {
  if (!result) return null;
  const roll = await new Roll("1d100").roll();
  roll["_total"] = result.isFumble ? -1 : result.successLevel;
  return roll;
}
