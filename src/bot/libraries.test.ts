import { describe, expect, it } from 'vitest'
import { REST_GAZE } from './face'
import { BLOUB_SEQUENCE, BLOUB_STATES, XINGCHENG_STATES } from './libraries'

describe('bibliotheques de mouvements', () => {
  it('conserve les quatorze etats Bloub comme bibliotheque executable', () => {
    expect(BLOUB_SEQUENCE).toHaveLength(14)
    expect(BLOUB_STATES).toHaveLength(15)
    for (const id of BLOUB_SEQUENCE) {
      const def = BLOUB_STATES.find((state) => state.id === id)
      expect(def, id).toBeDefined()
      expect(() => def!.pose(0.5)).not.toThrow()
    }
  })

  it('separe la pose de marque de la reference Bloub', () => {
    expect(REST_GAZE).toEqual({ yaw: 8, pitch: 8, roll: -13 })
    expect(XINGCHENG_STATES).not.toBe(BLOUB_STATES)
  })
})
