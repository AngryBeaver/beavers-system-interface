// Stars Without Number Revised (swnr). Was the module bsa-swnr, which is no longer needed.
import { SWNR } from "./Swnr.js";
import { SkillTest } from "./SkillTest.js";
import type { BuiltinBsa } from "../index.js";

export const swnr: BuiltinBsa = {
  system: "swnr",
  create: () => new SWNR(),
  testClasses: () => [new SkillTest()],
};
