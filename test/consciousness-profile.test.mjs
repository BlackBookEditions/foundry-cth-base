import test from "node:test"
import assert from "node:assert/strict"

import { CONSCIOUSNESS_MODIFIER_PROFILE } from "../module/config/cth.mjs"

test("le profil Conscience cible VOL et CHA avec la progression CTH", () => {
  assert.equal(CONSCIOUSNESS_MODIFIER_PROFILE.bonus.ability, "vol")
  assert.equal(CONSCIOUSNESS_MODIFIER_PROFILE.bonus.contextId, "cthTrauma")
  assert.deepEqual(Object.values(CONSCIOUSNESS_MODIFIER_PROFILE.bonus.values), [1, 3, 5, 10])
  assert.equal(CONSCIOUSNESS_MODIFIER_PROFILE.malus.ability, "cha")
  assert.deepEqual(Object.values(CONSCIOUSNESS_MODIFIER_PROFILE.malus.values), [-1, -3, -5, -10])
})
