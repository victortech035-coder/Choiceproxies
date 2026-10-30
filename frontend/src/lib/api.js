const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export async function getProducts() {
  const response = await fetch(`${API_URL}/products`)
  if (!response.ok) throw new Error('Could not load products')
  return response.json()
}

export async function createDemoOrder(productId) {
  const response = await fetch(`${API_URL}/orders/demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId })
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || 'Could not create order')
  return result
}
