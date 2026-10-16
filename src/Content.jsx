import { useState } from 'react'
import { assetUrl } from './assets'
import { useWebsite } from './useWebsite'
import { AsyncForm, Action } from './Forms'
import { Field, Empty, Badge } from './Customer'
import Dialog from './Dialog'

export function Gallery() {
  const { store } = useWebsite()
  const [photo, setPhoto] = useState(null)
  const photos = store.products.filter((p) => p.image)
  return (
    <>
      <p className="eyebrow">A LITTLE SWEET INSPIRATION</p>
      <h1>Moments worth celebrating</h1>
      {!photos.length && <Empty title="New creations are on their way" />}
      <div className="gallery-grid">
        {photos.map((p) => (
          <button key={p.id} onClick={() => setPhoto(p)}>
            <img src={assetUrl(p.image)} alt={p.name} />
            <span>{p.name}</span>
          </button>
        ))}
      </div>
      {photo && (
        <Dialog labelledBy="gallery-title" onClose={() => setPhoto(null)}>
          <h2 id="gallery-title">{photo.name}</h2>
          <img
            className="gallery-large"
            src={assetUrl(photo.image)}
            alt={photo.name}
          />
        </Dialog>
      )}
    </>
  )
}
export function About({ go }) {
  return (
    <div className="custom-section about-section">
      <img
        src={assetUrl('/images/celebration.jpg')}
        alt="A decorated celebration cake"
      />
      <div>
        <p className="eyebrow">MEET K SWEET KREATIONS CO</p>
        <h1>A little joy in every celebration.</h1>
        <p>
          Based in Lenasia South, Migson Manor, our bakery specialises in
          novelty and custom cakes, cupcakes and desserts for celebrations,
          events and gatherings.
        </p>
        <p>
          Share your inspiration and preferences, and our team will prepare a
          personal quotation.
        </p>
        <p>
          Collection only · Monday–Friday 09:00–17:00 · Saturday 09:00–15:00.
          Closed Sundays.
        </p>
        <button className="button dark" onClick={() => go('builder')}>
          Plan your custom cake
        </button>
      </div>
    </div>
  )
}
export function Reviews({ requireAccount, notify }) {
  const { store, user, act } = useWebsite()
  const [sent, setSent] = useState(false)
  const reviews = store.reviews.filter((r) => r.status === 'Published')
  return (
    <>
      <p className="eyebrow">SWEET WORDS</p>
      <h1>A little customer love</h1>
      <p>Feedback is reviewed by the bakery before appearing publicly.</p>
      <div className="checkout-layout">
        <section>
          {!reviews.length ? (
            <Empty
              title="The first sweet words are still to come"
              text="There are no published reviews yet."
            />
          ) : (
            reviews.map((r) => (
              <article className="panel review-card" key={r.id}>
                <p className="stars" aria-label={`${r.rating} out of 5 stars`}>
                  {'★'.repeat(r.rating)}
                </p>
                <p>{r.message}</p>
                <strong>{r.name}</strong>
              </article>
            ))
          )}
        </section>
        {!user ? (
          <section className="panel">
            <h2>Share your experience</h2>
            <button
              className="button dark"
              onClick={() => requireAccount('reviews')}
            >
              Sign in to leave feedback
            </button>
          </section>
        ) : user.role !== 'Customer' ? (
          <p>Customer accounts can submit feedback.</p>
        ) : sent ? (
          <Empty
            title="Thank you for sharing"
            text="Your feedback is awaiting Admin review."
          />
        ) : (
          <AsyncForm
            onSubmit={async (f) => {
              await act('reviews', { ...f, rating: Number(f.rating) })
              setSent(true)
              notify('Feedback submitted for review.')
            }}
          >
            <h2>Share a sweet moment</h2>
            <Field
              label="Display name"
              name="name"
              defaultValue={user.name}
              required
              maxLength={60}
            />
            <label className="field">
              <span>Your rating</span>
              <select name="rating">
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>
                    {r} stars
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Your feedback</span>
              <textarea name="message" rows="4" maxLength={1000} required />
            </label>
            <button className="button dark">Submit feedback</button>
          </AsyncForm>
        )}
      </div>
    </>
  )
}
export function ReviewModeration({ admin }) {
  const { store, act } = useWebsite()
  return (
    <section className="panel">
      <h2>Customer feedback</h2>
      <p>Admin reviews feedback before publishing it.</p>
      {!store.reviews.length && <Empty title="No feedback to review yet" />}
      {store.reviews.map((r) => (
        <article className="enquiry-row" key={r.id}>
          <div className="page-heading">
            <strong>
              {r.name} · {r.rating}/5
            </strong>
            <Badge text={r.status} />
          </div>
          <p>{r.message}</p>
          {admin && (
            <div className="button-row">
              <Action
                className="button outline"
                disabled={r.status === 'Published'}
                onClick={() =>
                  act(
                    `reviews/${r.id}/status`,
                    { status: 'Published' },
                    'PATCH',
                  )
                }
              >
                Publish feedback
              </Action>
              <Action
                className="text-button"
                disabled={r.status === 'Hidden'}
                onClick={() =>
                  act(`reviews/${r.id}/status`, { status: 'Hidden' }, 'PATCH')
                }
              >
                Hide feedback
              </Action>
            </div>
          )}
        </article>
      ))}
    </section>
  )
}
