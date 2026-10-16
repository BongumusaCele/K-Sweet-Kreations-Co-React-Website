import { useEffect, useId, useRef, useState } from 'react'
import { assetUrl } from './assets'
import { money } from './data'
import { useWebsite } from './useWebsite'
import { AsyncForm, Action } from './Forms'
import {
  addDays,
  today,
  slots,
  collectionError,
  cartTotal,
  depositAmount,
  outstandingAmount,
  paymentState,
  quoteExpired,
  validateImage,
  validateProof,
} from './rules'

const formatTime = (value) =>
  new Date(value).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })
const phonePattern = String.raw`\+?(?=(?:.*[0-9]){7})[0-9 \(\)\-]{7,20}`
export function Account({ go, pending, notify }) {
  const { user, login, logout, saveProfile } = useWebsite()
  const [mode, setMode] = useState('login')
  if (user)
    return (
      <div className="account-layout">
        <aside className="panel">
          <div className="avatar">{user.name.slice(0, 1)}</div>
          <h2>{user.name}</h2>
          <p>{user.role} account</p>
          {user.role === 'Customer' && (
            <button className="button dark" onClick={() => go('tracking')}>
              My orders & quotes
            </button>
          )}
          <Action className="text-button" onClick={logout}>
            Sign out
          </Action>
        </aside>
        <AsyncForm
          onSubmit={async (f) => {
            await saveProfile({ name: f.name.trim(), phone: f.phone.trim() })
            notify('Profile updated.')
          }}
        >
          <h2>Your details</h2>
          <Field
            label="Full name"
            name="name"
            defaultValue={user.name}
            minLength={2}
            maxLength={100}
            required
          />
          <Field label="Email" type="email" value={user.email} readOnly />
          <Field
            label="Phone number"
            name="phone"
            type="tel"
            pattern={phonePattern}
            defaultValue={user.phone}
            maxLength={20}
            required
          />
          <button className="button dark">Save profile</button>
        </AsyncForm>
      </div>
    )
  return (
    <div className="auth-wrap">
      <div className="auth-intro">
        <p className="eyebrow">WELCOME TO YOUR SWEET SPACE</p>
        <h2>
          Your celebrations,
          <br />
          all in one place.
        </h2>
        <p>Keep your quotes, orders and collection details together.</p>
        <img
          src={assetUrl('/images/cupcakes.jpg')}
          alt="Cupcakes with piped frosting"
        />
      </div>
      <AsyncForm
        className="auth-card form"
        key={mode}
        onSubmit={async (f) => {
          if (mode === 'register' && f.password !== f.confirmPassword)
            throw new Error('Passwords must match.')
          await login(
            { ...f, email: f.email.trim().toLowerCase() },
            mode === 'register',
          )
          notify(
            mode === 'register'
              ? 'Your account has been created.'
              : 'Welcome back.',
          )
          go(pending || 'tracking')
        }}
      >
        <p className="eyebrow">K SWEET KREATIONS CO</p>
        <h2>{mode === 'register' ? 'Create your account' : 'Welcome back'}</h2>
        {mode === 'register' && (
          <>
            <Field
              label="Full name"
              name="name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={100}
            />
            <Field
              label="Phone number"
              name="phone"
              type="tel"
              autoComplete="tel"
              pattern={phonePattern}
              maxLength={20}
              required
            />
          </>
        )}
        <Field
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={150}
          required
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete={
            mode === 'register' ? 'new-password' : 'current-password'
          }
          minLength={8}
          maxLength={128}
          required
        />
        {mode === 'register' && (
          <Field
            label="Confirm password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
          />
        )}
        <button className="button dark">
          {mode === 'register' ? 'Create account' : 'Sign in'}
        </button>
        <button
          type="button"
          className="text-button"
          onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
        >
          {mode === 'register'
            ? 'Already have an account? Sign in'
            : 'New here? Create an account'}
        </button>
      </AsyncForm>
    </div>
  )
}

export function Field({ label, ...props }) {
  if (props.type === 'password')
    return <PasswordField label={label} {...props} />
  return (
    <label className="field">
      <span>{label}</span>
      <input {...props} />
    </label>
  )
}
function PasswordField({ label, id, type: _type, ...props }) {
  const generatedId = useId()
  const inputId = id || generatedId
  const input = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const form = input.current?.form
    const hide = () => setVisible(false)
    form?.addEventListener('reset', hide)
    return () => form?.removeEventListener('reset', hide)
  }, [])
  return (
    <div className="field">
      <label htmlFor={inputId}>{label}</label>
      <div className="password-input">
        <input
          {...props}
          id={inputId}
          ref={input}
          type={visible ? 'text' : 'password'}
          data-password-field
        />
        <button
          className="password-toggle"
          type="button"
          aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
          aria-controls={inputId}
          aria-pressed={visible}
          disabled={props.disabled}
          onClick={() => setVisible((value) => !value)}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
            {visible && <path d="m3 3 18 18" />}
          </svg>
        </button>
      </div>
    </div>
  )
}
export function Error({ text }) {
  return text ? (
    <p className="error" role="alert">
      {text}
    </p>
  ) : null
}
export function CollectionFields({
  custom,
  blocked,
  date,
  setDate,
  time,
  setTime,
}) {
  return (
    <div className="form-row">
      <label className="field">
        <span>Preferred collection date</span>
        <input
          aria-label="Preferred collection date"
          type="date"
          min={addDays(today(), custom ? 7 : 1)}
          value={date}
          onChange={(e) => {
            setDate(e.target.value)
            setTime('')
          }}
          required
        />
        <small>
          {custom
            ? 'At least seven days ahead.'
            : 'From tomorrow; subject to bakery approval.'}{' '}
          No Sundays.{blocked.includes(date) && ' This date is blocked.'}
        </small>
      </label>
      <label className="field">
        <span>Collection time</span>
        <select
          aria-label="Collection time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
        >
          <option value="">Choose a 30-minute slot</option>
          {slots(date).map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <small>Your time is provisional until approved.</small>
      </label>
    </div>
  )
}
export function Cart({ cart, setCart, store, go, user, requireAccount }) {
  const total = cartTotal(cart, store.products)
  return (
    <>
      <div className="page-heading">
        <h1>Your cart ({cart.reduce((n, i) => n + i.quantity, 0)})</h1>
        <button className="button outline" onClick={() => go('shop')}>
          ← Continue shopping
        </button>
      </div>
      {!cart.length ? (
        <Empty
          title="Your cart is waiting for something sweet"
          action={() => go('shop')}
          label="Explore our cakes"
        />
      ) : (
        <div className="checkout-layout">
          <div className="panel cart-items">
            {cart.map((item) => {
              const p = store.products.find((p) => p.id === item.id)
              const quantity = (amount) =>
                setCart((items) =>
                  items.map((i) =>
                    i.id === item.id
                      ? {
                          ...i,
                          quantity: Math.max(
                            1,
                            Math.min(20, i.quantity + amount),
                          ),
                        }
                      : i,
                  ),
                )
              return (
                <article className="cart-item" key={item.id}>
                  <img
                    src={assetUrl(p?.image || item.image)}
                    alt={p?.name || item.name}
                  />
                  <div>
                    <h3>{p?.name || item.name}</h3>
                    <p>{p?.description}</p>
                    <small>Size: {p?.size}</small>
                    {!p?.active && (
                      <p className="error">
                        Unavailable. Remove before checkout.
                      </p>
                    )}
                  </div>
                  <strong>{money(p?.price || 0)}</strong>
                  <div className="quantity">
                    <button
                      aria-label={`Decrease ${item.name}`}
                      onClick={() => quantity(-1)}
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      disabled={item.quantity >= 20}
                      aria-label={`Increase ${item.name}`}
                      onClick={() => quantity(1)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    className="remove"
                    aria-label={`Remove ${item.name}`}
                    onClick={() =>
                      setCart((items) => items.filter((i) => i.id !== item.id))
                    }
                  >
                    ×
                  </button>
                </article>
              )
            })}
          </div>
          <aside className="panel summary">
            <h2>Order summary</h2>
            <div>
              <span>Subtotal</span>
              <strong>{money(total)}</strong>
            </div>
            <div>
              <span>Collection</span>
              <strong>Free</strong>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <strong>{money(total)}</strong>
            </div>
            <button
              className="button dark"
              disabled={cart.some(
                (i) => !store.products.find((p) => p.id === i.id)?.active,
              )}
              onClick={() =>
                user ? go('checkout') : requireAccount('checkout')
              }
            >
              Proceed to checkout
            </button>
            <p>Collection only. Standard orders require full payment.</p>
          </aside>
        </div>
      )}
    </>
  )
}
export function Checkout({ cart, setCart, go, notify }) {
  const { store, user, act } = useWebsite()
  const [submissionId] = useState(() => crypto.randomUUID())
  const [date, setDate] = useState(''),
    [time, setTime] = useState('')
  const total = cartTotal(cart, store.products)
  if (user.role !== 'Customer')
    return <Empty title="Please use a customer account to place an order" />
  if (!cart.length)
    return (
      <Empty
        title="Your cart is empty"
        action={() => go('shop')}
        label="Find a treat"
      />
    )
  return (
    <div className="checkout-layout">
      <AsyncForm
        onSubmit={async (f) => {
          const problem = collectionError(date, time, false, store.blocked)
          if (problem) throw new Error(problem)
          await act('orders', {
            submissionId,
            name: f.name.trim(),
            phone: f.phone.trim(),
            date,
            time,
            instructions: f.instructions,
            items: cart.map((i) => ({ id: i.id, quantity: i.quantity })),
          })
          setCart([])
          notify(
            'Your order has been placed. Submit your EFT proof in My orders.',
          )
          go('tracking')
        }}
      >
        <h2>Collection checkout</h2>
        <div className="form-row">
          <Field
            label="Full name"
            name="name"
            defaultValue={user.name}
            minLength={2}
            maxLength={100}
            required
          />
          <Field
            label="Phone number"
            name="phone"
            type="tel"
            pattern={phonePattern}
            defaultValue={user.phone}
            maxLength={20}
            required
          />
        </div>
        <CollectionFields
          {...{ date, setDate, time, setTime }}
          blocked={store.blocked}
        />
        <label className="field">
          <span>Special instructions or cake message</span>
          <textarea name="instructions" rows="3" maxLength={1000} />
        </label>
        <p className="soft-note">
          Pay by EFT and submit proof from your order. Payment is confirmed
          after the bakery verifies receipt. Collection requires bakery
          approval.
        </p>
        <button className="button dark">Place order · {money(total)}</button>
      </AsyncForm>
      <aside className="panel summary">
        <h2>Your sweet selection</h2>
        {cart.map((i) => (
          <div key={i.id}>
            <span>
              {i.name} × {i.quantity}
            </span>
            <strong>
              {money(
                (store.products.find((p) => p.id === i.id)?.price || 0) *
                  i.quantity,
              )}
            </strong>
          </div>
        ))}
        <div className="summary-total">
          <span>Total</span>
          <strong>{money(total)}</strong>
        </div>
        <p>Final prices are checked when your order is submitted.</p>
      </aside>
    </div>
  )
}
export function Builder({ go, notify }) {
  const { store, user, act } = useWebsite()
  const [submissionId] = useState(() => crypto.randomUUID())
  const [date, setDate] = useState(''),
    [time, setTime] = useState('')
  if (user.role !== 'Customer')
    return <Empty title="Please use a customer account to request a cake" />
  return (
    <div className="checkout-layout">
      <AsyncForm
        onSubmit={async (f, form) => {
          const problem = collectionError(date, time, true, store.blocked)
          if (problem) throw new Error(problem)
          const data = new FormData(form)
          data.set('submissionId', submissionId)
          data.set('date', date)
          data.set('time', time)
          const image = data.get('file')
          if (image?.size) {
            const error = validateImage(image)
            if (error) throw new Error(error)
          } else data.delete('file')
          await act('requests', data)
          notify('Your cake request has been sent to the bakery.')
          go('tracking')
        }}
      >
        <h2>Tell us about your cake</h2>
        <div className="form-row">
          <Field
            label="Full name"
            name="name"
            defaultValue={user.name}
            required
            minLength={2}
            maxLength={100}
          />
          <Field
            label="Phone number"
            name="phone"
            type="tel"
            pattern={phonePattern}
            defaultValue={user.phone}
            required
            maxLength={20}
          />
        </div>
        <label className="field">
          <span>Cake size</span>
          <select name="size" required>
            <option value="">Choose size</option>
            <option>15 cm · 8–10 servings</option>
            <option>20 cm · 12–16 servings</option>
            <option>25 cm · 20–24 servings</option>
          </select>
        </label>
        <div className="form-row">
          <label className="field">
            <span>Flavour</span>
            <select name="flavour" required>
              <option>Vanilla</option>
              <option>Chocolate</option>
              <option>Red velvet</option>
            </select>
          </label>
          <label className="field">
            <span>Filling</span>
            <select name="filling" required>
              <option>Vanilla buttercream</option>
              <option>Chocolate ganache</option>
              <option>Berry</option>
              <option>Discuss with bakery</option>
            </select>
          </label>
        </div>
        <CollectionFields
          custom
          {...{ date, setDate, time, setTime }}
          blocked={store.blocked}
        />
        <Field
          label="Inspiration image (optional, JPG/PNG/WebP, up to 2 MB)"
          name="file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
        />
        <label className="field">
          <span>Design, cake message and special instructions</span>
          <textarea name="comments" rows="4" maxLength={1000} />
        </label>
        <button className="button dark">Send cake request</button>
      </AsyncForm>
      <aside className="panel">
        <h2>Made for your celebration</h2>
        <p>
          The bakery reviews your design and collection time before preparing a
          personal quotation. Quotes are valid for three days.
        </p>
        <p>
          A verified 50% deposit confirms your booking once collection is
          approved. The remaining balance is due one day before collection.
        </p>
      </aside>
    </div>
  )
}
export function Orders({ notify }) {
  const { store, user, act, refresh } = useWebsite()
  const [query, setQuery] = useState('')
  const orders = store.orders.filter((o) =>
    `${o.reference} ${o.id}`.toLowerCase().includes(query.toLowerCase()),
  )
  if (user.role !== 'Customer')
    return <Empty title="Your orders are available in the bakery workspace" />
  return (
    <>
      <div className="page-heading">
        <h1>Your sweet journey</h1>
        <label className="search-box">
          <input
            aria-label="Find an order reference"
            placeholder="Find an order reference"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <Action className="button outline" onClick={refresh}>
          Refresh orders
        </Action>
      </div>
      {!!store.requests.length && (
        <section className="panel quotes-list">
          <h2>Your custom quotes</h2>
          {store.requests.map((q) => (
            <article className="quote-row" key={q.id}>
              <div>
                <strong>Request {q.id}</strong>
                <p>
                  {q.size} · {q.flavour} · {q.filling}
                </p>
                <small>
                  {q.date} at {q.time}
                </small>
              </div>
              <Badge text={q.status} />
              {q.amount != null && <strong>{money(q.amount)}</strong>}
              {q.notes && <p>{q.notes}</p>}
              {q.status === 'Quoted' && !quoteExpired(q) && (
                <div>
                  <p>Valid until {formatTime(q.expiresAt)}</p>
                  <Action
                    className="button dark"
                    onClick={async () => {
                      await act(`requests/${q.id}/respond`, {
                        status: 'Accepted',
                      })
                      notify(
                        'Quote accepted. Your deposit is awaiting payment.',
                      )
                    }}
                  >
                    Accept quote
                  </Action>
                  <Action
                    className="text-button"
                    onClick={() =>
                      act(`requests/${q.id}/respond`, { status: 'Declined' })
                    }
                  >
                    Decline
                  </Action>
                </div>
              )}
            </article>
          ))}
        </section>
      )}
      {!orders.length && (
        <Empty
          title="No matching orders yet"
          text="Your orders will appear here once you place one."
        />
      )}
      {orders.map((o) => (
        <OrderCard key={o.id} order={o} notify={notify} />
      ))}
    </>
  )
}
function OrderCard({ order: o, notify }) {
  const { act } = useWebsite()
  const stages = [
    'Confirmed',
    'In progress',
    'Ready for collection',
    'Collected',
  ]
  return (
    <article className="panel order-card">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{o.type.toUpperCase()} ORDER</p>
          <h2>{o.reference}</h2>
        </div>
        <Badge text={o.status} />
      </div>
      <div className="timeline">
        {stages.map((s, i) => (
          <div className={stages.indexOf(o.status) >= i ? 'done' : ''} key={s}>
            <span>{i + 1}</span>
            <strong>{s}</strong>
          </div>
        ))}
      </div>
      <div className="order-details">
        <div>
          <h3>Your selection</h3>
          {o.items.map((item, i) => (
            <div className="order-product" key={i}>
              <img src={assetUrl(item.image)} alt={item.name} />
              <div>
                <strong>{item.name}</strong>
                <p>
                  {item.size} · Qty {item.quantity}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div>
          <h3>Collection information</h3>
          <p>
            Lenasia South, Migson Manor
            <br />
            {o.date} · {o.time}
          </p>
          <p>
            {o.slotApproved
              ? 'Collection time approved'
              : 'Awaiting bakery approval'}
          </p>
        </div>
        <div>
          <h3>Payment</h3>
          <Badge text={paymentState(o)} />
          <p>
            Total: {money(o.total)}
            <br />
            Paid: {money(o.paid)}
            <br />
            Outstanding: {money(outstandingAmount(o))}
          </p>
          {o.type === 'Custom' && o.paid < o.total && (
            <small>
              Balance due {addDays(o.date, -1)}. Initial deposit:{' '}
              {money(depositAmount(o.total))}.
            </small>
          )}
        </div>
      </div>
      {o.paid < o.total && !['Cancelled', 'Collected'].includes(o.status) && (
        <details className="payment-details">
          <summary>Submit EFT proof</summary>
          <p>
            Transfer{' '}
            {money(
              o.type === 'Custom' && o.paid === 0
                ? depositAmount(o.total)
                : outstandingAmount(o),
            )}
            . Contact the bakery for its verified banking details. Proof is
            reviewed before payment is confirmed.
          </p>
          {o.payments.some((p) => p.status === 'Awaiting verification') ? (
            <p>Payment awaiting verification.</p>
          ) : (
            <AsyncForm
              key={o.payments.length}
              onSubmit={async (f, form) => {
                const data = new FormData(form)
                const error = validateProof(data.get('file'))
                if (error) throw new Error(error)
                await act(`orders/${o.id}/proof`, data)
                notify('Payment proof submitted for verification.')
              }}
            >
              <Field
                label="Bank payment reference"
                name="reference"
                required
                maxLength={100}
              />
              <Field
                label="EFT proof (PDF/JPG/PNG/WebP, up to 5 MB)"
                name="file"
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                required
              />
              <button className="button outline">Submit proof</button>
            </AsyncForm>
          )}
        </details>
      )}
      {!!o.payments.length && (
        <div>
          <h3>Payment history</h3>
          {o.payments.map((p) => (
            <p key={p.id}>
              {money(p.amount)} · {p.reference} · <Badge text={p.status} />
            </p>
          ))}
        </div>
      )}
      {!['Collected', 'Cancelled'].includes(o.status) && (
        <Action
          className="text-button"
          disabled={o.cancelRequested}
          onClick={async () => {
            await act(`orders/${o.id}/cancel`)
            notify('Cancellation requested. Admin will review it.')
          }}
        >
          {o.cancelRequested
            ? 'Cancellation requested'
            : 'Request cancellation'}
        </Action>
      )}
      <details className="history">
        <summary>Order history</summary>
        {o.history.map((h, i) => (
          <p key={i}>
            {h.status} · {formatTime(h.at)}
          </p>
        ))}
      </details>
    </article>
  )
}
export function Badge({ text }) {
  return (
    <span
      className={`badge ${['Collected', 'Fully paid', 'Accepted', 'Verified'].includes(text) ? 'success' : ''}`}
    >
      {text}
    </span>
  )
}
export function Empty({ title, text, action, label }) {
  return (
    <div className="empty-state">
      <h2>{title}</h2>
      {text && <p className="muted">{text}</p>}
      {action && (
        <button className="button dark" onClick={action}>
          {label}
        </button>
      )}
    </div>
  )
}
export function Contact({ notify }) {
  const { user, act } = useWebsite()
  const [sent, setSent] = useState(false)
  return (
    <>
      <h1>Let’s talk something sweet</h1>
      <p>A question, an idea or a celebration to plan? We’re here to help.</p>
      <div className="checkout-layout">
        {sent ? (
          <Empty
            title="Your enquiry has been sent"
            text="The bakery team will review your message."
          />
        ) : (
          <AsyncForm
            onSubmit={async (f) => {
              await act('enquiries', f)
              setSent(true)
              notify('Your enquiry has been sent.')
            }}
          >
            <h2>Send an enquiry</h2>
            <Field
              label="Your name"
              name="name"
              defaultValue={user?.name}
              required
              maxLength={100}
            />
            <Field
              label="Email address"
              name="email"
              type="email"
              defaultValue={user?.email}
              required
              maxLength={150}
            />
            <Field label="Subject" name="subject" required maxLength={200} />
            <label className="field">
              <span>Your message</span>
              <textarea
                name="message"
                rows="5"
                required
                minLength={10}
                maxLength={2000}
              />
            </label>
            <button className="button dark">Send enquiry</button>
          </AsyncForm>
        )}
        <aside className="panel">
          <h2>Find us in Lenasia South</h2>
          <p>
            Migson Manor, Lenasia South
            <br />
            Collection only.
          </p>
          <h3>Opening hours</h3>
          <p>
            Monday–Friday · 09:00–17:00
            <br />
            Saturday · 09:00–15:00
            <br />
            Closed Sundays
          </p>
        </aside>
      </div>
    </>
  )
}
