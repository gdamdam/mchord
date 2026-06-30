import type { LinkState } from '../transport'
import { Meter } from './Meter'

interface TopBarProps {
  getLevel: () => number
  link: LinkState
  effectiveBpm: number
}

/** Brand, live output meter, and Link status. */
export function TopBar({ getLevel, link, effectiveBpm }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="brand">
        <svg className="brand__mark" viewBox="0 0 512 512" aria-hidden="true">
          <rect x="60" y="120" width="392" height="64" rx="32" fill="var(--accent)" />
          <rect x="60" y="224" width="392" height="64" rx="32" fill="var(--accent-2)" />
          <rect x="60" y="328" width="392" height="64" rx="32" fill="var(--accent-3)" />
        </svg>
        <div className="brand__text">
          <span className="brand__name">
            mchord
            <sup className="brand__ver">v{__APP_VERSION__}</sup>
          </span>
          <span className="brand__tagline">Move through chords. Stay in flow.</span>
        </div>
      </div>

      <div className="topbar__status">
        <span
          className={`link-pill${link.connected ? ' is-on' : ''}`}
          title={
            link.connected
              ? `Ableton Link: following ${effectiveBpm.toFixed(1)} BPM`
              : 'Ableton Link offline'
          }
        >
          <span className="link-pill__dot" aria-hidden="true" />
          {link.connected
            ? `Link ${effectiveBpm.toFixed(1)} · ${link.peers} peer${link.peers === 1 ? '' : 's'}`
            : 'Link off'}
        </span>
        <Meter getLevel={getLevel} />
      </div>
    </header>
  )
}
