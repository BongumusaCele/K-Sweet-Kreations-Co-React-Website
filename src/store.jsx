import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from './api'
import { WebsiteContext } from './useWebsite'

const empty = () => ({
  products: [],
  customers: [],
  staff: [],
  orders: [],
  requests: [],
  enquiries: [],
  reviews: [],
  blocked: [],
  notifications: [],
})
const profile = (u) => ({
  id: u.userId,
  name: u.fullName,
  email: u.email,
  phone: u.phoneNumber,
  role: u.role,
})

export function WebsiteProvider({ children }) {
  const [store, setStore] = useState(empty)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const generation = useRef(0)
  const activeRequests = useRef(0)
  function invalidate() {
    generation.current++
  }

  const refresh = useCallback(async ({ background = false } = {}) => {
    if (background && activeRequests.current > 0) return
    const current = ++generation.current
    activeRequests.current++
    try {
      const data = await api('/website')
      if (
        ![
          'products',
          'customers',
          'staff',
          'orders',
          'requests',
          'enquiries',
          'reviews',
          'blocked',
        ].every((key) => Array.isArray(data?.[key]))
      ) {
        throw new Error(
          'The bakery service returned an unexpected response. Please refresh the records.',
        )
      }
      if (current === generation.current) {
        setStore(data)
        setError('')
      }
    } catch (e) {
      if (current === generation.current) setError(e.message)
      throw e
    } finally {
      activeRequests.current--
    }
  }, [])
  useEffect(() => {
    let active = true
    async function start() {
      try {
        const account = await api('/Auth/me', { quietUnauthorized: true })
        if (active) setUser(profile(account))
      } catch (e) {
        if (e.status !== 401 && active) setError(e.message)
      }
      if (active) {
        try {
          await refresh()
        } catch {
          /* Retry is offered in the page banner. */
        } finally {
          if (active) setLoading(false)
        }
      }
    }
    start()
    const expired = () => {
      invalidate()
      setUser(null)
      setStore(empty())
      setError('Your session has expired. Please sign in again.')
    }
    window.addEventListener('ksk-session-expired', expired)
    return () => {
      active = false
      invalidate()
      window.removeEventListener('ksk-session-expired', expired)
    }
  }, [refresh])

  // Keep every collection current across browser sessions, without resetting forms.
  // Hidden/offline tabs do not poll; concurrent background refreshes are coalesced.
  useEffect(() => {
    if (loading) return
    const sync = () => {
      if (document.visibilityState !== 'visible' || navigator.onLine === false)
        return
      refresh({ background: true }).catch(() => {
        /* The shared retry banner displays failures. */
      })
    }
    const timer = window.setInterval(sync, 30000)
    window.addEventListener('focus', sync)
    window.addEventListener('online', sync)
    window.addEventListener('hashchange', sync)
    document.addEventListener('visibilitychange', sync)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', sync)
      window.removeEventListener('online', sync)
      window.removeEventListener('hashchange', sync)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [loading, refresh])

  async function refreshAfterSave() {
    try {
      await refresh()
    } catch {
      setError(
        'Your change was saved, but the latest records could not be loaded. Please refresh the records.',
      )
    }
  }

  async function login(values, register = false) {
    if (register)
      await api('/Auth/register', {
        method: 'POST',
        body: {
          fullName: values.name,
          phoneNumber: values.phone,
          email: values.email,
          password: values.password,
          confirmPassword: values.confirmPassword,
        },
        quietUnauthorized: true,
      })
    const result = await api('/Auth/login', {
      method: 'POST',
      body: { email: values.email, password: values.password },
      quietUnauthorized: true,
    })
    setStore(empty())
    setUser(profile(result))
    try {
      await refresh()
    } catch {
      /* Sign-in succeeded; show a retryable data error. */
    }
  }
  async function logout() {
    await api('/Auth/logout', { method: 'POST' })
    generation.current++
    setUser(null)
    setStore(empty())
    try {
      await refresh()
    } catch {
      /* Public data can be retried. */
    }
  }
  async function saveProfile(values) {
    setUser(profile(await api('/Auth/me', { method: 'PUT', body: values })))
    await refreshAfterSave()
  }
  async function createStaff(values) {
    await api('/Auth/staff', { method: 'POST', body: values })
    await refreshAfterSave()
  }
  async function act(path, body, method = 'POST') {
    await api(`/website/${path}`, { method, body })
    await refreshAfterSave()
  }
  return (
    <WebsiteContext.Provider
      value={{
        store,
        user,
        loading,
        error,
        refresh,
        login,
        logout,
        saveProfile,
        createStaff,
        act,
      }}
    >
      {children}
    </WebsiteContext.Provider>
  )
}
