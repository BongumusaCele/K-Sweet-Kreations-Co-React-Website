import { useEffect, useState } from 'react'
import { products } from './data'
import { addDays, today } from './rules'
const initial = () => ({
  products,
  orders: [
    {
      id: 'KSK-1001',
      owner: 'customer@example.com',
      name: 'Alex',
      type: 'Standard',
      items: [{ ...products[0], quantity: 1 }],
      total: 360,
      paid: 360,
      status: 'In progress',
      date: addDays(today(), 9),
      time: '10:00',
      slotApproved: true,
      history: [
        { status: 'Confirmed', at: today() },
        { status: 'In progress', at: today() },
      ],
      payments: [
        { id: 'SAMPLE-1', amount: 360, method: 'EFT', status: 'Verified' },
      ],
    },
  ],
  requests: [],
  enquiries: [],
  blocked: [],
  notifications: [],
})
export function usePreviewStore() {
  const [store, setStore] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ksk-preview-v1')) || initial()
    } catch {
      return initial()
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem('ksk-preview-v1', JSON.stringify(store))
    } catch {
      /* Preview continues in memory if browser storage is full. */
    }
  }, [store])
  return [store, setStore]
}
export function createId(prefix) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
}
