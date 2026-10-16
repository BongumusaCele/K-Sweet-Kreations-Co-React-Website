import { useRef, useState } from 'react'

export function AsyncForm({
  children,
  onSubmit,
  className = 'panel form',
  ...props
}) {
  const lock = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  return (
    <form
      {...props}
      className={className}
      onSubmit={async (event) => {
        event.preventDefault()
        if (lock.current) return
        const form = event.currentTarget
        for (const field of form.querySelectorAll('input,textarea')) {
          if (
            field.required &&
            !field.hasAttribute('data-password-field') &&
            !['file', 'checkbox', 'password'].includes(field.type) &&
            !field.value.trim()
          ) {
            setError('Please complete all required fields.')
            field.focus()
            return
          }
        }
        lock.current = true
        setBusy(true)
        setError('')
        try {
          await onSubmit(Object.fromEntries(new FormData(form)), form)
        } catch (e) {
          setError(
            e.message ||
              'The request could not be completed. Please try again.',
          )
        } finally {
          lock.current = false
          setBusy(false)
        }
      }}
    >
      <fieldset disabled={busy} aria-busy={busy}>
        {children}
      </fieldset>
      {busy && <p role="status">Saving…</p>}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
export function Action({ children, onClick, ...props }) {
  const lock = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  return (
    <>
      <button
        type="button"
        {...props}
        disabled={props.disabled || busy}
        aria-busy={busy}
        onClick={async () => {
          if (lock.current) return
          lock.current = true
          setBusy(true)
          setError('')
          try {
            await onClick()
          } catch (e) {
            setError(e.message)
          } finally {
            lock.current = false
            setBusy(false)
          }
        }}
      >
        {busy ? 'Please wait…' : children}
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </>
  )
}
