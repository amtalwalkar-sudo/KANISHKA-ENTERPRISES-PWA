import React, { useEffect, useRef, useState } from 'react'
import './swipe-bar.css'

/**
 * Standalone multi-shell swipe action primitive.
 * Compatible with driver-pwa, fleet-pwa and delivery-pwa hosts.
 */
export default function SwipeActionBar({ label, onSwipeComplete, targetState, disabled = false, className = '' }) {
  const trackRef = useRef(null)
  const pointerId = useRef(null)
  const startX = useRef(0)
  const [progress, setProgress] = useState(0)
  const [dragging, setDragging] = useState(false)

  useEffect(() => () => { pointerId.current = null }, [])

  const track = () => trackRef.current
  const setPosition = value => {
    const next = Math.max(0, Math.min(100, value))
    setProgress(next)
    const el = track()
    if (el) el.style.setProperty('--swipe-progress', `${next}%`)
  }

  const onPointerDown = event => {
    if (disabled || event.button !== undefined && event.button !== 0) return
    pointerId.current = event.pointerId
    startX.current = event.clientX
    setDragging(true)
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const onPointerMove = event => {
    if (!dragging || event.pointerId !== pointerId.current) return
    const width = Math.max(1, track()?.clientWidth || 1)
    setPosition(((event.clientX - startX.current) / width) * 100)
  }

  const finish = event => {
    if (!dragging || event.pointerId !== pointerId.current) return
    const completed = progress >= 70
    pointerId.current = null
    setDragging(false)
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    if (completed && !disabled) {
      setPosition(100)
      try { navigator.vibrate?.([30, 50]) } catch {}
      onSwipeComplete(targetState)
    } else {
      setPosition(0)
    }
  }

  const onKeyDown = event => {
    // Keyboard users get an explicit equivalent action; ordinary clicks never trigger it.
    if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      try { navigator.vibrate?.([30, 50]) } catch {}
      onSwipeComplete(targetState)
    }
  }

  return <div
    ref={trackRef}
    className={`swipe-action-bar ${dragging ? 'is-dragging' : ''} ${disabled ? 'is-disabled' : ''} ${className}`}
    role="slider"
    aria-label={label}
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuenow={Math.round(progress)}
    aria-disabled={disabled}
    tabIndex={disabled ? -1 : 0}
    onKeyDown={onKeyDown}
    onPointerDown={onPointerDown}
    onPointerMove={onPointerMove}
    onPointerUp={finish}
    onPointerCancel={finish}
  >
    <span className="swipe-action-bar__ambient" aria-hidden="true" />
    <span className="swipe-action-bar__label">{label}</span>
    <span className="swipe-action-bar__gps" aria-hidden="true">GPS • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    <span className="swipe-action-bar__chevrons" aria-hidden="true">›››</span>
    <span className="swipe-action-bar__handle" aria-hidden="true" style={{ transform: `translate3d(calc(${progress}% - ${progress * 0.64}px), 0, 0)` }}>›</span>
  </div>
}
