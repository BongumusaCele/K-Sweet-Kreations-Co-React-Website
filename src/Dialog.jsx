import { useEffect, useRef } from 'react'
export default function Dialog({
  children,
  onClose,
  labelledBy,
  className = '',
}) {
  const ref = useRef(null)
  useEffect(() => {
    const dialog = ref.current
    dialog.showModal()
    return () => dialog.close()
  }, [])
  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      aria-labelledby={labelledBy}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
    >
      <button
        className="modal-close"
        aria-label="Close details"
        onClick={onClose}
      >
        ×
      </button>
      {children}
    </dialog>
  )
}
