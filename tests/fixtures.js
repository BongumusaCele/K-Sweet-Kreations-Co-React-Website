export const catalogue = [
  {
    id: 1,
    name: 'Chocolate Luxe',
    category: 'Cakes',
    price: 360,
    servings: '10–12',
    size: '20 cm',
    image: '/images/chocolate.jpg',
    description: 'Chocolate cake',
    active: true,
  },
  {
    id: 2,
    name: 'Vanilla Cupcakes',
    category: 'Cupcakes',
    price: 120,
    servings: '6',
    size: 'Box of 6',
    image: '/images/cupcakes.jpg',
    description: 'Vanilla cupcakes',
    active: true,
  },
]
export const publicData = () => ({
  products: catalogue,
  customers: [],
  staff: [],
  orders: [],
  requests: [],
  reviews: [],
  enquiries: [],
  blocked: [],
  notifications: [],
})
export async function mockPublic(page) {
  await page.route('**/api/Auth/me', (route) =>
    route.fulfill({ status: 401, json: { message: 'Please sign in.' } }),
  )
  await page.route('**/api/website', (route) =>
    route.fulfill({ json: publicData() }),
  )
}
