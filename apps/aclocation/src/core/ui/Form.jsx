import React from 'react'
import { cn } from './cn.js'

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900',
        'placeholder:text-slate-400',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500',
        'disabled:bg-slate-50 disabled:text-slate-500',
        className,
      )}
      {...props}
    />
  )
}

export function Textarea({ className, rows = 4, ...props }) {
  return (
    <textarea
      rows={rows}
      className={cn(
        'w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900',
        'placeholder:text-slate-400',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500',
        className,
      )}
      {...props}
    />
  )
}

export function Select({ className, children, ...props }) {
  return (
    <select
      className={cn(
        'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}

export function Label({ className, children, htmlFor, required }) {
  return (
    <label htmlFor={htmlFor} className={cn('block text-sm font-medium text-slate-700 mb-1', className)}>
      {children}
      {required && <span aria-hidden="true" className="ml-0.5 text-rose-600">*</span>}
    </label>
  )
}

let _idCounter = 0
function useStableId(prefix) {
  const ref = React.useRef(null)
  if (ref.current === null) {
    _idCounter += 1
    ref.current = `${prefix}-${_idCounter}`
  }
  return ref.current
}

export function Field({ label, htmlFor, hint, error, required, children }) {
  const fallbackId = useStableId('field')
  const inputId = htmlFor || fallbackId
  const hintId = hint ? `${inputId}-hint` : undefined
  const errorId = error ? `${inputId}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  let enhancedChild = children
  try {
    const child = React.Children.only(children)
    if (React.isValidElement(child)) {
      enhancedChild = React.cloneElement(child, {
        id: child.props.id || inputId,
        'aria-describedby': child.props['aria-describedby'] || describedBy,
        'aria-invalid': error ? true : child.props['aria-invalid'],
        'aria-required': required ? true : child.props['aria-required'],
        required: required ?? child.props.required,
      })
    }
  } catch {
    enhancedChild = children
  }

  return (
    <div className="space-y-1">
      {label && <Label htmlFor={inputId} required={required}>{label}</Label>}
      {enhancedChild}
      {hint && !error && <p id={hintId} className="text-xs text-slate-500">{hint}</p>}
      {error && <p id={errorId} role="alert" className="text-xs text-rose-600">{error}</p>}
    </div>
  )
}
