import { rollCheck, toRoll } from "./Check.js";

/** characteristics and luck: the abilities of CoC7 (key in system.characteristics / system.attribs) */
const CHARACTERISTICS = ["str", "con", "siz", "dex", "app", "int", "pow", "edu"];

/**
 * Call of Cthulhu 7th Edition (CoC7).
 * Skills are identified by their CoC ID (e.g. "i.skill.spot-hidden"), so recipes do not depend on the language.
 * A skill the actor does not have is added by CoC7 itself (with its base value) when it is rolled.
 */
export class CoC7 implements SystemApi {
  _skills: SkillConfig[] = [];

  get version() {
    return 2;
  }

  get id() {
    return "CoC7";
  }

  async init() {
    try {
      const list = await (game as foundry.Game)["CoC7"].skillNames.getList();
      this._skills = Object.entries(list ?? {})
        .map(([cocid, item]: [string, any]) => ({ id: cocid, label: item.name }))
        .sort((a, b) => a.label.localeCompare(b.label));
    } catch (e) {
      console.error("Beavers System Interface | CoC7 skills could not be loaded", e);
    }
  }

  get configSkills(): SkillConfig[] {
    return this._skills;
  }

  get configAbilities(): AbilityConfig[] {
    const i18n = (game as foundry.Game)["i18n"];
    return [
      ...CHARACTERISTICS.map((key) => ({ id: key, label: i18n.localize("CHARAC." + key.toUpperCase()) })),
      { id: "lck", label: i18n.localize("CoC7.Luck") },
    ];
  }

  get configCurrencies(): CurrencyConfig[] {
    // CoC7 has no coins: prices are text per era and cash follows from credit rating
    return [];
  }

  get configCanRollAbility(): boolean {
    return true;
  }

  get configLootItemType(): string {
    return "item";
  }

  get itemPriceAttribute(): string {
    return "system.price";
  }

  get itemQuantityAttribute(): string {
    return "system.quantity";
  }

  /** the roll's total is the CoC7 success level: fumble -1, failure 0, regular 1, hard 2, extreme 3, critical 4 */
  async actorRollSkill(actor, skillId: string, difficulty: number = 1): Promise<Roll | null> {
    return toRoll(await this.rollSkill(actor, skillId, difficulty));
  }

  /** abilities are the characteristics (str…edu), luck (lck) and sanity (san) */
  async actorRollAbility(actor, abilityId: string, difficulty: number = 1): Promise<Roll | null> {
    return toRoll(await this.rollAbility(actor, abilityId, difficulty));
  }

  rollSkill(actor, skillId: string, difficulty: number) {
    return rollCheck(actor, () => actor.skillCheck(skillId, false, { difficulty }));
  }

  rollAbility(actor, abilityId: string, difficulty: number) {
    const key = abilityId.toLowerCase();
    if (CHARACTERISTICS.includes(key)) {
      return rollCheck(actor, () => actor.characteristicCheck(key, false, { difficulty }));
    }
    return rollCheck(actor, () => actor.attributeCheck(key, false, { difficulty }));
  }

  actorSheetAddTab(sheet, html, actor, tabData: { id: string; label: string; html: string }, tabBody: string): void {
    const root = $(sheet.element instanceof HTMLElement ? sheet.element : sheet.element?.[0] ?? html);
    const firstTab = root.find('nav [data-action="tab"][data-group]').first();
    if (firstTab.length === 0) return;
    const nav = firstTab.closest("nav");
    const group = firstTab.attr("data-group") as string;
    const body = root.find(`section.tab[data-group="${group}"]`).first().parent();
    root.find(`[data-group="${group}"][data-tab="${tabData.id}"]`).remove();
    // tabData.html is an icon like <i class="fas fa-scroll"/>, which html does not close by itself
    const icon = `<i class="${/class="([^"]*)"/.exec(tabData.html)?.[1] ?? "fas fa-scroll"}" inert></i>`;
    // investigator sheet v3: the tabs are ribbons on the left, the small ones show an icon only
    const ribbon = nav.find("a.tab.small-ribbon").length > 0;
    const tabItem = ribbon
      ? $(
          `<a class="tab small-ribbon bsa-coc7-crafting" data-action="tab" data-group="${group}" data-tab="${tabData.id}" data-tooltip="${tabData.label}">${icon}</a>`,
        )
      : $(
          `<a class="item bsa-coc7-crafting" data-action="tab" data-group="${group}" data-tab="${tabData.id}" data-tooltip="${tabData.label}">${icon} <span>${tabData.label}</span></a>`,
        );
    const tabContent = $(
      `<section class="tab bsa-coc7-tab scrollable" data-group="${group}" data-tab="${tabData.id}"></section>`,
    );
    nav.find(`[data-action="tab"][data-group="${group}"]`).last().after(tabItem);
    body.append(tabContent);
    tabContent.append(tabBody);
    // CoC7 resets the active tab to its default on every render when it does not know it (getTabs), so it is remembered here.
    // beavers-crafting asks for its tab by setting activeTab (e.g. after crafting) and calls changeTab on every render,
    // that request is used once, or the user could not leave the tab.
    if (!sheet._bsaCoC7ChangeTab) {
      sheet._bsaCoC7ChangeTab = true;
      const changeTab = sheet.changeTab.bind(sheet);
      sheet.changeTab = (tab, tabGroup, options) => {
        if (sheet.activeTab === tab) delete sheet.activeTab;
        if (tabGroup === group || tabGroup === "primary") sheet._bsaCoC7Active = tab === tabData.id;
        return changeTab(tab, tabGroup === "primary" ? group : tabGroup, options);
      };
    }
    if (sheet._bsaCoC7Active) {
      sheet.changeTab(tabData.id, group, { force: true, updatePosition: false });
    }
  }

  itemSheetReplaceContent(app, html, element): void {
    const content = $(html).find(".window-content");
    const header = content.find("header").first().clone();
    content.css("overflow-y", "auto");
    content.empty();
    if (header.length) content.append(header);
    content.append(element);
  }
}
