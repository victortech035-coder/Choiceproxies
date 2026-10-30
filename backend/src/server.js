import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import crypto from 'node:crypto'

const app = express()
const port = Number(process.env.PORT || 4000)
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(s => s.trim())

app.disable('x-powered-by')
app.use(helmet())
app.use(cors({ origin(origin, callback) {
  if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
  return callback(new Error('Origin not allowed by CORS'))
} }))
app.use(express.json({ limit: '30kb' }))
app.use('/api', rateLimit({ windowMs: 60_000, limit: 100, standardHeaders: true, legacyHeaders: false }))

const products = [
  { id: 'res-us', name: 'Residential Starter', type: 'Residential', location: 'United States', protocol: 'HTTP(S) / SOCKS5', duration: '7 days', price: 8.99, unit: 'package', description: 'A starter package for everyday privacy and testing.' },
  { id: 'dc-global', name: 'Datacenter Global', type: 'Datacenter', location: 'Multiple locations', protocol: 'HTTP(S) / SOCKS5', duration: '30 days', price: 12.50, unit: 'package', description: 'Fast datacenter access for permitted workflows.' },
  { id: 'static-uk', name: 'Static Residential UK', type: 'Static residential', location: 'United Kingdom', protocol: 'HTTP(S)', duration: '30 days', price: 18.00, unit: 'package', description: 'A stable endpoint for compatible applications.' }
]

const demoOrders = new Map()
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'choiceproxies-api', mode: process.env.NODE_ENV || 'development' }))
app.get('/api/products', (_req, res) => res.json({ products, mode: 'demo', message: 'Sample catalog; connect a real proxy provider before selling.' }))

app.post('/api/orders/demo', (req, res) => {
  const parsed = z.object({ productId: z.string().min(1).max(100) }).safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'A valid productId is required.' })
  const product = products.find(p => p.id === parsed.data.productId)
  if (!product) return res.status(404).json({ error: 'Product not found.' })
  const orderId = `CP-DEMO-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
  const order = { orderId, productId: product.id, productName: product.name, amount: product.price, status: 'DEMO_ONLY_NOT_PAID', createdAt: new Date().toISOString() }
  demoOrders.set(orderId, order)
  return res.status(201).json({ orderId, status: order.status, message: 'Demo order created. No payment was taken and no proxy was provisioned.', order })
})

// Payment initiation and callbacks must be added for a selected provider.
// Do not mark orders paid based on browser input. Verify signed provider callbacks server-side.
app.use((err, _req, res, _next) => {
  console.error('API error:', process.env.NODE_ENV === 'production' ? 'Request failed' : err.message)
  res.status(500).json({ error: 'Unexpected server error.' })
})

app.listen(port, () => console.log(`Choiceproxies API listening on http://localhost:${port}`))
