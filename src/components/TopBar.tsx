import type { LinkState } from '../transport'
import { Meter } from './Meter'
import { WORDMARK_ASCII } from './displayNames'

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
        <div className="brand__logo">
          <pre className="brand__ascii" aria-hidden="true">{WORDMARK_ASCII}</pre>
          <span className="brand__ver">v{__APP_VERSION__}</span>
          <span className="sr-only">mchord version {__APP_VERSION__}</span>
        </div>
        <span className="brand__tagline">Move through chords. Stay in flow.</span>
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
