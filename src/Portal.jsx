import { useEffect, useRef, useState } from 'react'
import { assetUrl } from './assets'
import { mediaUrl } from './api'
import { useWebsite } from './useWebsite'
import { AsyncForm, Action } from './Forms'
import { Badge, Field, Empty } from './Customer'
import { ReviewModeration } from './Content'
import { money } from './data'
import {
  canTransition,
  paymentState,
  outstandingAmount,
  today,
  validateImage,
} from './rules'
import Dialog from './Dialog'

export default function Portal({ role, onWebsite, onLogout, notify }) {
  const { store, user, act, error, refresh, createStaff, loading } =
    useWebsite()
  const [tab, setTab] = useState('Overview'),
    [query, setQuery] = useState(''),
    [filter, setFilter] = useState('All'),
    [editing, setEditing] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const sidebar = useRef(null)
  const menuToggle = useRef(null)
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 901px)')
    const resize = () => {
      setMenuOpen(false)
      if (desktop.matches && document.activeElement === menuToggle.current)
        sidebar.current?.querySelector('nav button.active')?.focus()
      if (
        !desktop.matches &&
        sidebar.current
          ?.querySelector('.portal-sidebar-content')
          ?.contains(document.activeElement)
      )
        menuToggle.current?.focus()
    }
    desktop.addEventListener('change', resize)
    return () => desktop.removeEventListener('change', resize)
  }, [])
  useEffect(() => {
    if (!menuOpen) return
    const escape = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setMenuOpen(false)
        menuToggle.current?.focus()
      }
    }
    const outside = (event) => {
      if (!sidebar.current?.contains(event.target)) setMenuOpen(false)
    }
    document.addEventListener('keydown', escape)
    document.addEventListener('pointerdown', outside)
    return () => {
      document.removeEventListener('keydown', escape)
      document.removeEventListener('pointerdown', outside)
    }
  }, [menuOpen])
  const admin = role === 'Admin'
  const tabs = [
    'Overview',
    'Orders',
    'Cake requests',
    ...(admin ? ['Products'] : []),
    'Collections',
    'Enquiries',
    'Feedback',
    ...(admin ? ['Customers', 'Staff accounts'] : []),
  ]
  const orders = store.orders.filter(
    (o) =>
      (filter === 'All' || o.status === filter) &&
      `${o.reference} ${o.name}`.toLowerCase().includes(query.toLowerCase()),
  )
  const order =
    editing?.kind === 'order'
      ? store.orders.find((o) => o.id === editing.id)
      : null
  const request =
    editing?.kind === 'quote'
      ? store.requests.find((r) => r.id === editing.id)
      : null
  if (loading)
    return (
      <main className="section">
        <p role="status">Loading bakery records…</p>
      </main>
    )
  return (
    <div className="portal">
      <aside
        className={`portal-sidebar${menuOpen ? ' navigation-open' : ''}`}
        ref={sidebar}
        onBlur={(event) => {
          if (
            event.relatedTarget &&
            !event.currentTarget.contains(event.relatedTarget)
          )
            setMenuOpen(false)
        }}
      >
        <div className="portal-sidebar-top">
          <div className="portal-brand">
            <span>K Sweet</span>
            <small>KREATIONS CO</small>
          </div>
          <button
            className="portal-menu-toggle"
            type="button"
            ref={menuToggle}
            aria-label={
              menuOpen ? 'Close workspace menu' : 'Open workspace menu'
            }
            aria-expanded={menuOpen}
            aria-controls="workspace-navigation"
            onClick={() => setMenuOpen((value) => !value)}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d={
                  menuOpen ? 'm6 6 12 12M6 18 18 6' : 'M4 6h16M4 12h16M4 18h16'
                }
              />
            </svg>
          </button>
        </div>
        <div className="portal-sidebar-content" id="workspace-navigation">
          <p className="sidebar-caption">BAKERY WORKSPACE</p>
          <nav aria-label="Bakery navigation">
            {tabs.map((t) => (
              <button
                className={tab === t ? 'active' : ''}
                aria-current={tab === t ? 'page' : undefined}
                key={t}
                onClick={() => {
                  if (menuOpen) {
                    setMenuOpen(false)
                    menuToggle.current?.focus()
                  }
                  setTab(t)
                  setQuery('')
                  setFilter('All')
                  refresh().catch(() => {
                    /* The shared banner offers a retry. */
                  })
                }}
              >
                {t}
                <span aria-hidden="true">›</span>
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div>
              <strong>{user.name}</strong>
              <small>{role}</small>
            </div>
            <Action onClick={onLogout}>Sign out</Action>
          </div>
        </div>
      </aside>
      <div className="portal-content">
        <header className="portal-header">
          <span>K Sweet Kreations Co / {tab}</span>
          <Badge text={role} />
        </header>
        <main className="portal-main">
          <div className="page-heading">
            <div>
              <p className="eyebrow">BAKERY WORKSPACE</p>
              <h1>{tab === 'Overview' ? 'Hello, bakery team.' : tab}</h1>
            </div>
            <button className="button outline" onClick={onWebsite}>
              View customer website
            </button>
          </div>
          {error && (
            <div className="service-banner error" role="alert">
              {error}
              <Action onClick={refresh}>Refresh records</Action>
            </div>
          )}
          <Action className="text-button" onClick={refresh}>
            Refresh records
          </Action>
          <p className="muted">
            Records update automatically every 30 seconds and when you return to
            this page.
          </p>
          {tab === 'Overview' && (
            <>
              <div className="stats-grid">
                {[
                  [
                    'Active orders',
                    store.orders.filter(
                      (o) => !['Collected', 'Cancelled'].includes(o.status),
                    ).length,
                  ],
                  [
                    'Requests to review',
                    store.requests.filter((r) =>
                      ['Submitted', 'Under review'].includes(r.status),
                    ).length,
                  ],
                  [
                    'EFT proofs pending',
                    store.orders
                      .flatMap((o) => o.payments)
                      .filter((p) => p.status === 'Awaiting verification')
                      .length,
                  ],
                  [
                    'Verified payments',
                    money(store.orders.reduce((total, o) => total + o.paid, 0)),
                  ],
                ].map(([label, value]) => (
                  <article className="stat-card" key={label}>
                    <p>{label}</p>
                    <strong>{value}</strong>
                  </article>
                ))}
              </div>
              <section className="panel">
                <h2>Current orders</h2>
                <OrderTable
                  orders={orders.slice(0, 10)}
                  onSelect={(o) => setEditing({ kind: 'order', id: o.id })}
                />
              </section>
            </>
          )}
          {tab === 'Orders' && (
            <section className="panel">
              <div className="filter-controls">
                <input
                  aria-label="Search orders"
                  placeholder="Order reference or customer"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <select
                  aria-label="Filter order status"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  {[
                    'All',
                    'Awaiting confirmation',
                    'Confirmed',
                    'In progress',
                    'Ready for collection',
                    'Collected',
                    'Cancelled',
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <OrderTable
                orders={orders}
                onSelect={(o) => setEditing({ kind: 'order', id: o.id })}
              />
            </section>
          )}
          {tab === 'Cake requests' && (
            <section className="panel">
              {!store.requests.length && <Empty title="No cake requests yet" />}
              {store.requests.map((r) => (
                <article className="enquiry-row" key={r.id}>
                  <div className="page-heading">
                    <h3>
                      Request {r.id} · {r.name}
                    </h3>
                    <Badge text={r.status} />
                  </div>
                  <p>
                    {r.size} · {r.flavour} · {r.date} at {r.time}
                  </p>
                  <button
                    className="button outline"
                    onClick={() => setEditing({ kind: 'quote', id: r.id })}
                  >
                    Review request
                  </button>
                </article>
              ))}
            </section>
          )}
          {tab === 'Products' && admin && (
            <section className="panel">
              <button
                className="button dark"
                onClick={() =>
                  setEditing({
                    kind: 'product',
                    product: { active: true, category: 'Cakes' },
                  })
                }
              >
                Add product
              </button>
              {!store.products.length && (
                <Empty title="Add your first bakery product" />
              )}
              {store.products.map((p) => (
                <article className="cart-item" key={p.id}>
                  <img src={assetUrl(p.image)} alt={p.name} />
                  <div>
                    <h3>{p.name}</h3>
                    <p>
                      {money(p.price)} · {p.category}
                    </p>
                    <Badge text={p.active ? 'Available' : 'Unavailable'} />
                  </div>
                  <div className="product-actions">
                    <button
                      className="button outline"
                      onClick={() =>
                        setEditing({ kind: 'product', product: p })
                      }
                    >
                      Edit product
                    </button>
                    <button
                      className="button danger-outline"
                      onClick={() =>
                        setEditing({ kind: 'delete-product', product: p })
                      }
                    >
                      Delete product
                    </button>
                  </div>
                </article>
              ))}
            </section>
          )}
          {tab === 'Collections' && (
            <>
              <section className="panel">
                <h2>Collection diary</h2>
                <OrderTable
                  orders={store.orders
                    .filter(
                      (o) =>
                        o.date >= today() &&
                        !['Collected', 'Cancelled'].includes(o.status),
                    )
                    .sort((a, b) =>
                      `${a.date} ${a.time}`.localeCompare(
                        `${b.date} ${b.time}`,
                      ),
                    )}
                  onSelect={(o) => setEditing({ kind: 'order', id: o.id })}
                />
              </section>
              <section className="panel">
                <h2>Blocked dates</h2>
                {admin && (
                  <AsyncForm
                    onSubmit={async (f) => {
                      await act(`blocked/${f.date}`, undefined, 'PUT')
                      notify('Collection date blocked.')
                    }}
                  >
                    <Field
                      label="Block collection date"
                      name="date"
                      type="date"
                      min={today()}
                      required
                    />
                    <button className="button outline">Block date</button>
                  </AsyncForm>
                )}
                {!store.blocked.length && <p>No dates are blocked.</p>}
                {store.blocked.map((date) => (
                  <p key={date}>
                    {date}{' '}
                    {admin && (
                      <Action
                        className="text-button"
                        onClick={() =>
                          act(`blocked/${date}`, undefined, 'DELETE')
                        }
                      >
                        Unblock
                      </Action>
                    )}
                  </p>
                ))}
              </section>
            </>
          )}
          {tab === 'Enquiries' && (
            <section className="panel">
              {!store.enquiries.length && <Empty title="No enquiries yet" />}
              {store.enquiries.map((e) => (
                <article className="enquiry-row" key={e.id}>
                  <div className="page-heading">
                    <h3>{e.subject}</h3>
                    <Badge text={e.status} />
                  </div>
                  <p>
                    {e.name} · {e.email}
                  </p>
                  <p>{e.message}</p>
                  <div className="button-row">
                    {['New', 'In progress', 'Resolved'].map((status) => (
                      <Action
                        key={status}
                        className="button outline"
                        disabled={e.status === status}
                        onClick={() =>
                          act(`enquiries/${e.id}/status`, { status }, 'PATCH')
                        }
                      >
                        {status}
                      </Action>
                    ))}
                  </div>
                </article>
              ))}
            </section>
          )}
          {tab === 'Feedback' && <ReviewModeration admin={admin} />}
          {tab === 'Customers' && admin && (
            <section className="panel">
              <h2>Registered customers ({store.customers.length})</h2>
              {!store.customers.length ? (
                <Empty title="No customers registered yet" />
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Orders</th>
                        <th>Cake requests</th>
                        <th>Account</th>
                      </tr>
                    </thead>
                    <tbody>
                      {store.customers.map((customer) => (
                        <tr key={customer.id}>
                          <td>{customer.name}</td>
                          <td>{customer.email}</td>
                          <td>{customer.phone}</td>
                          <td>{customer.orderCount}</td>
                          <td>{customer.requestCount}</td>
                          <td>
                            <Badge
                              text={customer.active ? 'Active' : 'Inactive'}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
          {tab === 'Staff accounts' && admin && (
            <>
              <section className="panel">
                <h2>Registered Staff ({store.staff.length})</h2>
                {!store.staff.length ? (
                  <Empty title="No Staff accounts yet" />
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Account</th>
                        </tr>
                      </thead>
                      <tbody>
                        {store.staff.map((member) => (
                          <tr key={member.id}>
                            <td>{member.name}</td>
                            <td>{member.email}</td>
                            <td>{member.phone}</td>
                            <td>
                              <Badge
                                text={member.active ? 'Active' : 'Inactive'}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
              <AsyncForm
                onSubmit={async (f, form) => {
                  if (f.password !== f.confirmPassword)
                    throw new Error('Passwords must match.')
                  await createStaff({
                    fullName: f.name,
                    phoneNumber: f.phone,
                    email: f.email,
                    password: f.password,
                    confirmPassword: f.confirmPassword,
                  })
                  form.reset()
                  notify('Staff account created.')
                }}
              >
                <h2>Create Staff account</h2>
                <Field
                  label="Full name"
                  name="name"
                  required
                  minLength={2}
                  maxLength={100}
                />
                <Field
                  label="Email"
                  name="email"
                  type="email"
                  required
                  maxLength={150}
                />
                <Field
                  label="Phone number"
                  name="phone"
                  type="tel"
                  required
                  pattern={String.raw`\+?(?=(?:.*[0-9]){7})[0-9 \(\)\-]{7,20}`}
                  maxLength={20}
                />
                <Field
                  label="Temporary password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  maxLength={128}
                />
                <Field
                  label="Confirm password"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  maxLength={128}
                />
                <button className="button dark">Create Staff account</button>
              </AsyncForm>
            </>
          )}
        </main>
      </div>
      {editing && (
        <Dialog
          className="portal-modal"
          labelledBy="edit-title"
          onClose={() => setEditing(null)}
        >
          {editing.kind === 'product' && admin && (
            <ProductEditor
              product={editing.product}
              onSaved={() => {
                setEditing(null)
                notify('Product saved.')
              }}
            />
          )}
          {editing.kind === 'delete-product' && admin && (
            <>
              <h2 id="edit-title">Delete product?</h2>
              <p>
                Remove <strong>{editing.product.name}</strong> from the shop and
                product list? Existing orders and their history will be kept.
              </p>
              <div className="button-row delete-product-actions">
                <button
                  className="button outline"
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </button>
                <Action
                  className="button danger"
                  onClick={async () => {
                    await act(
                      `products/${editing.product.id}`,
                      undefined,
                      'DELETE',
                    )
                    setEditing(null)
                    notify('Product deleted.')
                  }}
                >
                  Delete product
                </Action>
              </div>
            </>
          )}
          {request && (
            <>
              <h2 id="edit-title">Request {request.id}</h2>
              <Badge text={request.status} />
              <div className="request-detail">
                <p>
                  {request.name} · {request.owner} · {request.phone}
                </p>
                <p>
                  {request.size} · {request.flavour} · {request.filling}
                </p>
                <p>
                  Collection: {request.date} at {request.time}
                </p>
                <p>{request.comments}</p>
                {request.image && (
                  <img
                    src={mediaUrl(request.image.url)}
                    alt="Customer cake inspiration"
                  />
                )}
              </div>
              {['Submitted', 'Under review', 'Quoted', 'Expired'].includes(
                request.status,
              ) && (
                <>
                  <AsyncForm
                    onSubmit={async (f) => {
                      await act(`requests/${request.id}/quote`, {
                        amount: Number(f.amount),
                        notes: f.notes,
                      })
                      setEditing(null)
                      notify('Quotation sent. Valid for three days.')
                    }}
                  >
                    <Field
                      label="Final quoted amount (R)"
                      name="amount"
                      type="number"
                      min="0.01"
                      max="99999999.99"
                      step="0.01"
                      defaultValue={request.amount}
                      required
                    />
                    <label className="field">
                      <span>Quote notes and confirmed design</span>
                      <textarea
                        name="notes"
                        defaultValue={request.notes}
                        rows="3"
                        maxLength={1000}
                        required
                      />
                    </label>
                    <label className="checkbox">
                      <input type="checkbox" required /> I have reviewed the
                      design and approved the requested collection slot.
                    </label>
                    <button className="button dark">Send manual quote</button>
                  </AsyncForm>
                  <div className="button-row">
                    <Action
                      className="button outline"
                      onClick={() =>
                        act(
                          `requests/${request.id}/status`,
                          { status: 'Under review' },
                          'PATCH',
                        )
                      }
                    >
                      Mark under review
                    </Action>
                    <Action
                      className="text-button"
                      onClick={async () => {
                        await act(
                          `requests/${request.id}/status`,
                          { status: 'Declined' },
                          'PATCH',
                        )
                        setEditing(null)
                      }}
                    >
                      Decline request
                    </Action>
                  </div>
                </>
              )}
              {request.notes && <p>{request.notes}</p>}
              {request.expiresAt && (
                <p>
                  Valid until{' '}
                  {new Date(request.expiresAt).toLocaleString('en-ZA', {
                    timeZone: 'Africa/Johannesburg',
                  })}
                </p>
              )}
            </>
          )}
          {order && (
            <>
              <h2 id="edit-title">{order.reference}</h2>
              <div className="request-detail">
                <Badge text={order.status} />
                <p>
                  {order.name} · {order.owner} · {order.phone}
                </p>
                <p>
                  {order.date} at {order.time}
                </p>
                {order.items.map((i, index) => (
                  <p key={index}>
                    {i.name} × {i.quantity}
                  </p>
                ))}
                <p>{order.instructions}</p>
                <p>
                  Total {money(order.total)} · Paid {money(order.paid)} ·
                  Outstanding {money(outstandingAmount(order))}
                </p>
                <Badge text={paymentState(order)} />
              </div>
              <h3>Collection approval</h3>
              <Action
                className="button outline"
                disabled={
                  order.slotApproved ||
                  ['Cancelled', 'Collected'].includes(order.status)
                }
                onClick={() => act(`orders/${order.id}/approve-slot`)}
              >
                {order.slotApproved
                  ? 'Collection time approved'
                  : 'Approve collection time'}
              </Action>
              <h3 className="spaced-heading">Order progress</h3>
              <div className="button-row wrap">
                {[
                  'Confirmed',
                  'In progress',
                  'Ready for collection',
                  'Collected',
                ].map((status) => (
                  <Action
                    key={status}
                    className="button outline"
                    disabled={
                      order.status === status || !canTransition(order, status)
                    }
                    onClick={() =>
                      act(`orders/${order.id}/status`, { status }, 'PATCH')
                    }
                  >
                    {status}
                  </Action>
                ))}
              </div>
              <h3 className="spaced-heading">Payment proofs</h3>
              {!order.payments.length && <p>No proof submitted yet.</p>}
              {order.payments.map((p) => (
                <div className="payment-row" key={p.id}>
                  <div>
                    <strong>
                      {money(p.amount)} · {p.reference}
                    </strong>
                    <Badge text={p.status} />
                    {p.proofUrl && (
                      <a
                        href={mediaUrl(p.proofUrl)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View payment proof
                      </a>
                    )}
                  </div>
                  {admin && p.status === 'Awaiting verification' && (
                    <>
                      <Action
                        className="button dark"
                        onClick={() =>
                          act(
                            `payments/${p.id}/verify`,
                            { status: 'Verified' },
                            'PATCH',
                          )
                        }
                      >
                        Verify payment
                      </Action>
                      <Action
                        className="text-button"
                        onClick={() =>
                          act(
                            `payments/${p.id}/verify`,
                            { status: 'Rejected' },
                            'PATCH',
                          )
                        }
                      >
                        Reject proof
                      </Action>
                    </>
                  )}
                </div>
              ))}
              {!admin && <p>Admin verifies payments.</p>}
              {order.cancelRequested && (
                <div className="soft-note">
                  Cancellation requested. Refunds are handled manually.
                  {admin &&
                    !['Cancelled', 'Collected'].includes(order.status) && (
                      <Action
                        className="text-button"
                        onClick={() =>
                          act(
                            `orders/${order.id}/status`,
                            { status: 'Cancelled' },
                            'PATCH',
                          )
                        }
                      >
                        Approve cancellation
                      </Action>
                    )}
                </div>
              )}
              <h3>Status history</h3>
              {order.history.map((h, i) => (
                <p key={i}>
                  {h.status} ·{' '}
                  {new Date(h.at).toLocaleString('en-ZA', {
                    timeZone: 'Africa/Johannesburg',
                  })}
                </p>
              ))}
            </>
          )}
        </Dialog>
      )}
    </div>
  )
}

function ProductEditor({ product, onSaved }) {
  const { act } = useWebsite()
  return (
    <>
      <AsyncForm
        onSubmit={async (f, form) => {
          const data = new FormData(form)
          const file = data.get('file')
          if (file?.size) {
            const error = validateImage(file)
            if (error) throw new Error(error)
          } else data.delete('file')
          data.set('active', f.active === 'on' ? 'true' : 'false')
          await act(
            product.id ? `products/${product.id}/upload` : 'products/upload',
            data,
            product.id ? 'PUT' : 'POST',
          )
          onSaved()
        }}
      >
        <h2 id="edit-title">
          {product.id ? 'Edit product' : 'Add a sweet treat'}
        </h2>
        <Field
          label="Product name"
          name="name"
          defaultValue={product.name}
          required
          maxLength={150}
        />
        <label className="field">
          <span>Description</span>
          <textarea
            name="description"
            defaultValue={product.description}
            required
            maxLength={1000}
          />
        </label>
        <div className="form-row">
          <Field
            label="Price (R)"
            name="price"
            type="number"
            min="0.01"
            max="99999999.99"
            step="0.01"
            defaultValue={product.price}
            required
          />
          <label className="field">
            <span>Category</span>
            <select name="category" defaultValue={product.category}>
              <option>Cakes</option>
              <option>Cupcakes</option>
              <option>Desserts</option>
            </select>
          </label>
        </div>
        <div className="form-row">
          <Field
            label="Size"
            name="size"
            defaultValue={product.size}
            required
            maxLength={100}
          />
          <Field
            label="Servings"
            name="servings"
            defaultValue={product.servings}
            required
            maxLength={100}
          />
        </div>
        {product.image && (
          <img
            className="product-preview"
            src={assetUrl(product.image)}
            alt="Current product photograph"
          />
        )}
        <Field
          label="Product photograph (JPG/PNG/WebP, up to 2 MB)"
          name="file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
        />
        <p>
          {product.id
            ? 'Choose a photograph to replace the current image, or leave it unchanged.'
            : 'Choose a photograph to upload with your new product.'}
        </p>
        <label className="checkbox">
          <input
            name="active"
            type="checkbox"
            defaultChecked={product.active}
          />{' '}
          Available to order
        </label>
        <button className="button dark">Save product</button>
      </AsyncForm>
    </>
  )
}
function OrderTable({ orders, onSelect }) {
  if (!orders.length) return <Empty title="No orders to show" />
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Collection</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>
                <strong>{o.reference}</strong>
                <small>{o.type}</small>
              </td>
              <td>{o.name}</td>
              <td>
                {o.date}
                <small>{o.time}</small>
              </td>
              <td>
                {money(o.total)}
                <small>{paymentState(o)}</small>
              </td>
              <td>
                <Badge text={o.status} />
              </td>
              <td>
                <button className="text-button" onClick={() => onSelect(o)}>
                  View order
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
