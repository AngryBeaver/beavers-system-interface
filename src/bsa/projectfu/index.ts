// Fabula Ultima (projectfu). Was the module bsa-projectfu, which is no longer needed.
import { ProjectFu } from "./ProjectFu.js";
import { AbilityTest } from "./AbilityTest.js";
import type { BuiltinBsa } from "../index.js";

export const projectfu: BuiltinBsa = {
  system: "projectfu",
  create: () => new ProjectFu(),
  testClasses: () => [new AbilityTest()],
};
