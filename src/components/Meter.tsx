import { useEffect, useRef, useState } from 'react'

interface MeterProps {
  /** Returns the current 0..1 output peak. Polled here so the rest of the app
   *  doesn't re-render at meter rate. Returns 0 before audio starts. */
  getLevel: () => number
}

export function Meter({ getLevel }: MeterProps) {
  const [level, setLevel] = useState(0)
  const getRef = useRef(getLevel)
  useEffect(() => {
    getRef.current = getLevel
  })
  useEffect(() => {
    const id = setInterval(() => setLevel(getRef.current()), 100)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="meter" aria-label={`Output level ${Math.round(level * 100)} percent`}>
      <span className="meter__fill" style={{ width: `${Math.min(100, level * 100)}%` }} />
    </span>
  )
}
