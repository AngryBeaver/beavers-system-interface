/**
 * System adaptations (BSA) that ship with beavers-system-interface, one directory per system: src/bsa/<system>/.
 * Each directory has an index.ts exporting a BuiltinBsa, the implementation, its test classes and bsa.css.
 *
 * A built-in adaptation wins over a separately installed bsa-<system> module: it is registered before
 * "beavers-system-interface.init" is called, and later registrations for the same system and its test types are ignored.
 * Only the adaptation of the running system is created, and only its bsa.css is loaded.
 */
import { projectfu } from "./projectfu/index.js";
import { swnr } from "./swnr/index.js";

export interface BuiltinBsa {
  /** game.system.id this adaptation is for, also the directory name */
  system: string;
  create: () => SystemApi;
  /** created on "ready", when game.i18n is available */
  testClasses: () => TestClass<any>[];
}

const BUILTIN: BuiltinBsa[] = [projectfu, swnr];

export function builtinBsa(systemId: string): BuiltinBsa | undefined {
  return BUILTIN.find((b) => b.system === systemId);
}

/** loads modules/beavers-system-interface/bsa/<system>/bsa.css */
export function loadBsaCss(namespace: string, systemId: string) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `modules/${namespace}/bsa/${systemId}/bsa.css`;
  link.dataset.bsa = systemId;
  document.head.append(link);
}
