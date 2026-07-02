import { describe, expect, it } from 'vitest'
import { resolveEffectiveBpm } from './useInstrument'

describe('resolveEffectiveBpm', () => {
  it('uses the scene tempo without Link', () => {
    expect(resolveEffectiveBpm(128, { connected: false, tempo: 90 })).toBe(128)
  })

  it('uses Link tempo when the scheduler starts after Link connected', () => {
    expect(resolveEffectiveBpm(128, { connected: true, tempo: 90 })).toBe(90)
  })
})
