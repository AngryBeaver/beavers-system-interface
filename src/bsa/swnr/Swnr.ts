export class SWNR implements SystemApi {
  get version() {
    return 2;
  }

  get id() {
    return "swnr";
  }

  async actorRollSkill(actor, skillId): Promise<Roll | null> {
    const skill = this.configSkills.find((s) => s.id === skillId);
    if (skill) {
      const sameName = (name: string) => name?.trim().toLowerCase() === skill.label.trim().toLowerCase();
      // skills are items of the actor. Without it the skill is rolled untrained (rank -1), the rule of swnr itself,
      // through a temporary skill item so swnr's own dialog and chat card are used.
      const item =
        actor.items.find((i) => i.type === "skill" && sameName(i.name)) ??
        // @ts-ignore foundry types are older than the "system" field
        new CONFIG.Item.documentClass({ name: skill.label, type: "skill", system: { rank: -1 } }, { parent: actor });
      {
        //Very unstable Workaround for systems that do not return anything for rolls
        const deferred = new Deferred();
        const hook = (message, temp, userId) => {
          if (userId === (game as foundry.Game)["users"].current.id && message.rolls && message.rolls[0]) {
            deferred.resolve(message.rolls[0]);
            Hooks.off("createChatMessage", hook);
          }
        };
        Hooks.on("createChatMessage", hook);
        await item.roll();
        window.setTimeout(() => {
          deferred.resolve(null);
          Hooks.off("createChatMessage", hook);
        }, 30000);
        return deferred.promise;
      }
    }
    // @ts-ignore
    ui.notifications.warn("skill " + skillId + " is not known");
    return null;
  }

  async waitForChatMessage(maxTime = 2000): Promise<Roll | null> {
    return new Promise((resolve, reject) => {
      let hookId;
      hookId = Hooks.once("createChatMessage", (chatMessage, options, userId) => {
        clearTimeout(timeout);
        if (!chatMessage.rolls) {
          resolve(null);
        }
        resolve(chatMessage.rolls[0]);
      });
      const timeout = setTimeout(() => {
        Hooks.off("createChatMessage", hookId); // Destroy the hook to prevent it from lingering
        resolve(null); // Return `null` or handle however you want after a timeout
      }, maxTime);
    });
  }

  async actorRollAbility(actor, abilityId): Promise<Roll | null> {
    throw new Error("can not do this");
  }

  actorCurrenciesGet(actor): Currencies {
    return { balance: actor["system"].credits.balance };
  }

  async actorCurrenciesStore(actor, currencies: Currencies): Promise<void> {
    await actor.update({ system: { credits: currencies } });
  }

  actorSheetAddTab(sheet, html, actor, tabData: { id: string; label: string; html: string }, tabBody: string): void {
    if (sheet.tabGroups) {
      this._actorSheetAddTabV2(sheet, tabData, tabBody);
    } else {
      this._actorSheetAddTabV1(html, tabData, tabBody);
    }
  }

  /**
   * swnr 2.x (ApplicationV2): foundry switches tabs for links with data-action="tab".
   * The tab is kept active across re-renders through foundry's own tabGroups.
   */
  _actorSheetAddTabV2(sheet, tabData: { id: string; label: string; html: string }, tabBody: string): void {
    const root = $(sheet.element instanceof HTMLElement ? sheet.element : sheet.element?.[0]);
    const nav = root.find("nav.sheet-tabs");
    const firstTab = nav.find('[data-action="tab"][data-group]').first();
    if (firstTab.length === 0) return;
    const group = firstTab.attr("data-group") as string;
    const body = root.find(`.tab[data-group="${group}"]`).first().parent();
    root.find(`[data-group="${group}"][data-tab="${tabData.id}"]`).remove();
    const tabItem = $(
      `<a data-action="tab" data-group="${group}" data-tab="${tabData.id}" data-tooltip="${tabData.label}">${tabData.html} <span>${tabData.label}</span></a>`,
    );
    const tabContent = $(`<section class="tab flexcol sheet-body" data-group="${group}" data-tab="${tabData.id}"></section>`);
    if (sheet.tabGroups[group] === tabData.id) {
      nav.find(`[data-group="${group}"]`).removeClass("active");
      body.children(".tab").removeClass("active");
      tabItem.addClass("active");
      tabContent.addClass("active");
    }
    nav.find(`[data-action="tab"][data-group="${group}"]`).last().after(tabItem);
    body.append(tabContent);
    tabContent.append(tabBody);
    // beavers-crafting asks for its tab by setting activeTab (e.g. after crafting) and calls changeTab on every render.
    // Foundry keeps the active tab in tabGroups itself, so the request is used once, or the user could not leave the tab.
    if (!sheet._bsaSwnrChangeTab) {
      sheet._bsaSwnrChangeTab = true;
      const changeTab = sheet.changeTab.bind(sheet);
      sheet.changeTab = (tab, tabGroup, options) => {
        if (sheet.activeTab === tab) delete sheet.activeTab;
        return changeTab(tab, tabGroup, options);
      };
    }
  }

  _actorSheetAddTabV1(html, tabData: { id: string; label: string; html: string }, tabBody: string): void {
    const tabs = $(html).find('.sheet-tabs [data-group="primary"]').parent();
    const tabItem = $(
      '<a class="sheet-body" data-group="primary" data-action="tab" data-tab="' +
        tabData.id +
        '" title="' +
        tabData.label +
        '">' +
        tabData.label +
        "</a>",
    );
    tabs.append(tabItem);
    const body = $(html).find(".window-content");
    $(html).find(".beavers-tab-content").remove();
    const tabContent = $(
      '<section class="beavers-tab-content tab flexcol sheet-body" data-group="primary" data-tab="' +
        tabData.id +
        '"></section>',
    );
    body.append(tabContent);
    tabContent.append(tabBody);
  }

  itemSheetReplaceContent(app, html, element): void {
    const content = html.find(".window-content");
    const header = html.find(".sheet-header").clone();
    content.css("overflow-y", "auto");
    content.empty();
    content.append(header);
    content.append(element);
  }

  /**
   * every skill list swnr can load onto an actor (classic, revised, cwn, psionic, space magic).
   * classic comes first so ids of existing recipes stay the same; a skill in several lists is offered once.
   */
  get configSkills(): SkillConfig[] {
    const lists = ((game as foundry.Game)["i18n"].translations.swnr as any).skills;
    const order = ["classic", ...Object.keys(lists).filter((k) => k !== "classic")];
    const result: SkillConfig[] = [];
    for (const list of order) {
      if (typeof lists[list] !== "object" || Array.isArray(lists[list])) continue;
      for (const [key, value] of Object.entries(lists[list])) {
        // @ts-ignore
        const label = value?.name;
        if (typeof label !== "string") continue;
        if (result.some((s) => s.id === key || s.label === label)) continue;
        result.push({ id: key, label });
      }
    }
    return result;
  }

  get configAbilities(): AbilityConfig[] {
    return [
      { id: "STR", label: "STR" },
      { id: "DEX", label: "DEX" },
      { id: "CON", label: "CON" },
      {
        id: "INT",
        label: "INT",
      },
      { id: "WIS", label: "WIS" },
      { id: "CHA", label: "CHA" },
    ];
  }

  get configCurrencies(): CurrencyConfig[] {
    return [
      {
        id: "balance",
        factor: 1,
        label: (game as foundry.Game)["i18n"].localize("swnr.credits.balance"),
      },
    ];
  }

  get configCanRollAbility(): boolean {
    return false;
  }

  get configLootItemType(): string {
    return "item";
  }

  get itemPriceAttribute(): string {
    return "system.cost";
  }

  get itemQuantityAttribute(): string {
    return "system.quantity";
  }
}

class Deferred {
  promise;
  reject;
  resolve;

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.reject = reject;
      this.resolve = resolve;
    });
  }
}
