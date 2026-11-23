// Call of Cthulhu 7th Edition (CoC7). Built in since 2.5.0, there never was a separate bsa module.
import { CoC7 } from "./CoC7.js";
import { AbilityTest, SanityTest, SkillTest } from "./Tests.js";
import type { BuiltinBsa } from "../index.js";

export const coc7: BuiltinBsa = {
  system: "CoC7",
  create: () => new CoC7(),
  testClasses: () => [new SkillTest(), new AbilityTest(), new SanityTest()],
};
