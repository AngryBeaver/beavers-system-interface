// @ts-ignore
export class ProjectFu implements SystemApi {
  skillList: SkillConfig[] = [];
  _currencyComponent: Component;

  get version() {
    return 2;
  }

  get id() {
    return "projectfu";
  }

  // @ts-ignore
  async actorRollSkill(actor, skillId): Promise<Roll | null> {
    throw new Error("Method not implemented.");
  }
  // @ts-ignore
  async actorRollAbility(actor, abilityId): Promise<Roll | null> {
    throw new Error("Method not implemented.");
  }

  actorCurrenciesGet(actor): Currencies {
    return { zenit: actor["system"].resources.zenit.value };
  }

  async actorCurrenciesStore(actor, currencies: Currencies): Promise<void> {
    await actor.update({ system: { resources: { zenit: { value: currencies.zenit } } } });
  }

  actorSheetAddTab(sheet, html, actor, tabData: { id: string; label: string; html: string }, tabBody: string): void {
    if (sheet.tabGroups) {
      this._actorSheetAddTabV2(sheet, tabData, tabBody);
    } else {
      this._actorSheetAddTabV1(sheet, html, tabData, tabBody);
    }
  }

  /**
   * projectfu >= 3 (ApplicationV2): foundry only switches tabs for links with data-action="tab".
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
      `<a data-action="tab" class="item button-style" data-group="${group}" data-tab="${tabData.id}" data-tooltip="${tabData.label}">${tabData.html}</a>`,
    );
    const tabContent = $(`<div class="tab flexcol desc" style="width:inherit" data-group="${group}" data-tab="${tabData.id}"></div>`);
    if (sheet.tabGroups[group] === tabData.id) {
      nav.find(`[data-group="${group}"]`).removeClass("active");
      body.children(".tab").removeClass("active");
      tabItem.addClass("active");
      tabContent.addClass("active");
    }
    const last = nav.find(`[data-action="tab"][data-group="${group}"]`).last();
    last.after(tabItem);
    body.append(tabContent);
    tabContent.append(tabBody);
    // beavers-crafting asks for its tab by setting activeTab (e.g. after crafting) and calls changeTab on every render.
    // Foundry keeps the active tab in tabGroups itself, so the request is used once, or the user could not leave the tab.
    if (!sheet._bsaProjectfuChangeTab) {
      sheet._bsaProjectfuChangeTab = true;
      const changeTab = sheet.changeTab.bind(sheet);
      sheet.changeTab = (tab, tabGroup, options) => {
        if (sheet.activeTab === tab) delete sheet.activeTab;
        return changeTab(tab, tabGroup, options);
      };
    }
  }

  _actorSheetAddTabV1(sheet, html, tabData: { id: string; label: string; html: string }, tabBody: string): void {
    const tabs = $(html).find("nav.sheet-tabs");
    const tabItem = $(
      '<a class="item button-style" data-group="primary" data-tab="' +
        tabData.id +
        '" title="' +
        tabData.label +
        '">' +
        tabData.html +
        "</a>",
    );
    tabs.find("a.item.button-style:not(.zenit-style)").last().after(tabItem);
    const body = $(html).find("nav.sheet-tabs").parent();
    const tabSelector = `.tab[data-group="primary"][data-tab="${tabData.id}"]`;
    body.find(tabSelector).remove();
    const tabContent = $(
      '<div class="tab flexcol desc" style="width:inherit" data-group="primary" data-tab="' + tabData.id + '"></div>',
    );
    body.append(tabContent);
    tabContent.append(tabBody);
    $(html)
      .find('nav.sheet-tabs[data-group="primary"] [data-tab]')
      .on("click", (e) => {
        sheet.activeTab = e.currentTarget.dataset.tab;
      });
  }

  itemSheetReplaceContent(app, html, element): void {
    html.find(".sheet-header div:last").remove();
    $(html).find(".sheet-header").nextAll().remove();
    const body = $('<div class="desc sheet-body"/>');
    body.append(element);
    html.find(".sheet-header").after(body);
  }

  get configSkills(): SkillConfig[] {
    if (this.skillList.length === 0) {
      this.skillList = (game as foundry.Game)["packs"].get("projectfu.skills").index.map((skill) => {
        return { id: skill._id, label: skill.name };
      });
    }
    return this.skillList;
  }

  get configAbilities(): AbilityConfig[] {
    return [
      {
        id: "dex",
        label: "Dexterity",
      },
      {
        id: "mig",
        label: "Might",
      },
      {
        id: "ins",
        label: "Insight",
      },
      {
        id: "wlp",
        label: "Willpower",
      },
    ];
  }

  get configCurrencies(): CurrencyConfig[] {
    return [
      {
        id: "zenit",
        factor: 1,
        label: "Zenit",
      },
    ];
  }

  get configCanRollAbility(): boolean {
    return true;
  }
  // "basic" is a basic attack in projectfu, "treasure" is the item that has a quantity and a price
  get configLootItemType(): string {
    return "treasure";
  }

  get itemPriceAttribute(): string {
    return "system.cost.value";
  }

  get itemQuantityAttribute(): string {
    return "system.quantity.value";
  }
}
