import { useEffect, useState } from 'react'
import { Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import { Activity, ArrowRight, BadgeCheck, Boxes, Check, ChevronDown, CircleHelp, Clock3, CreditCard, Globe2, LayoutDashboard, LockKeyhole, LogIn, Menu, Network, ShieldCheck, ShoppingBag, UserRound, X, Zap } from 'lucide-react'
import { supabase, hasSupabase } from './lib/supabase'
import { createDemoOrder, getProducts } from './lib/api'

const demoProducts = [
  { id: 'res-us', name: 'Residential Starter', type: 'Residential', location: 'United States', protocol: 'HTTP(S) / SOCKS5', duration: '7 days', price: 8.99, unit: 'package', description: 'A starter package for everyday privacy and testing.' },
  { id: 'dc-global', name: 'Datacenter Global', type: 'Datacenter', location: 'Multiple locations', protocol: 'HTTP(S) / SOCKS5', duration: '30 days', price: 12.50, unit: 'package', description: 'Fast datacenter access for permitted workflows.' },
  { id: 'static-uk', name: 'Static Residential UK', type: 'Static residential', location: 'United Kingdom', protocol: 'HTTP(S)', duration: '30 days', price: 18.00, unit: 'package', description: 'A stable endpoint for compatible applications.' }
]

function Logo() {
  return <Link className="brand" to="/"><span className="brand-mark"><Network size={21}/></span><span>Choice<span className="brand-blue">proxies</span></span></Link>
}

function Header({ user, onSignOut }) {
  const [open, setOpen] = useState(false)
  return <header className="topbar"><div className="topbar-inner"><Logo/><nav className={open ? 'nav nav-open' : 'nav'}>
    <NavLink to="/" onClick={() => setOpen(false)}>Home</NavLink><NavLink to="/proxies" onClick={() => setOpen(false)}>Proxy plans</NavLink><a href="#features" onClick={() => setOpen(false)}>Why Choiceproxies</a>
  </nav><div className="header-actions">{user ? <><Link className="button button-ghost button-small" to="/dashboard"><LayoutDashboard size={16}/> Dashboard</Link><button className="button button-ghost button-small" onClick={onSignOut}>Sign out</button></> : <><Link className="login-link" to="/login">Log in</Link><Link className="button button-primary button-small" to="/signup">Get started <ArrowRight size={15}/></Link></>}<button className="mobile-menu" aria-label="Toggle menu" onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button></div></div></header>
}

function Footer() {
  return <footer className="footer"><div className="footer-main"><div><Logo/><p>Proxy plans and account access.</p></div><div><strong>Explore</strong><Link to="/proxies">Proxy plans</Link><Link to="/dashboard">Dashboard</Link></div><div><strong>Policies</strong><Link to="/acceptable-use">Acceptable use</Link></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Choiceproxies</span><span>For lawful, authorized use only.</span></div></footer>
}

function Home() {
  return <><main><section className="hero shell"><div className="hero-copy"><div className="eyebrow">PROXY PLANS, MADE CLEAR</div><h1>Find a plan that<br/><span className="gradient-text">fits your needs.</span></h1><p className="hero-lead">Compare residential and datacenter options, review pricing, and manage your account in one place.</p><div className="hero-actions"><Link className="button button-primary" to="/proxies">View proxy plans <ArrowRight size={17}/></Link><a className="button button-ghost" href="#features">How it works</a></div><div className="hero-trust"><span><ShieldCheck size={16}/> Email sign-in</span><span><Globe2 size={16}/> Multiple plan types</span><span><Boxes size={16}/> Demo orders clearly marked</span></div></div><div className="hero-art"><div className="orb orb-one"></div><div className="orb orb-two"></div><div className="network-card"><div className="network-head">PLAN OVERVIEW <span className="network-dots">•••</span></div><div className="globe-wrap"><Globe2 size={94} strokeWidth={1.1}/><span className="orbit orbit-a"></span><span className="orbit orbit-b"></span></div><div className="network-stats"><div><span>Plan types</span><strong>Residential, datacenter</strong></div><div><span>Protocols</span><strong>HTTP(S), SOCKS5</strong></div></div><div className="network-note"><ShieldCheck size={17}/><span>Sample plans shown</span></div></div><div className="floating-pill pill-top"><span className="pill-icon"><LockKeyhole size={17}/></span><span><strong>Email sign-in</strong><small>Manage your account</small></span></div><div className="floating-pill pill-bottom"><span className="pill-icon purple"><Zap size={17}/></span><span><strong>Plan details</strong><small>Compare before choosing</small></span></div></div></section>
  <section className="trust-strip"><div className="shell trust-items"><span><Globe2/> Residential and datacenter</span><span><CreditCard/> Prices shown up front</span><span><Boxes/> Sample orders only</span><span><CircleHelp/> Acceptable use policy</span></div></section>
  <section className="section shell" id="features"><div className="section-heading"><div className="eyebrow">WHAT YOU CAN DO</div><h2>Plans and account details, <span className="gradient-text">in one place.</span></h2><p>Browse the sample catalog and create an account to see the current demo features.</p></div><div className="feature-grid"><Feature icon={<Globe2/>} title="Compare plans" text="Review plan type, location, protocol, duration, and sample pricing."/><Feature icon={<LayoutDashboard/>} title="Manage your account" text="Sign in to access the customer dashboard."/><Feature icon={<ShieldCheck/>} title="Know what’s live" text="Demo orders are labeled clearly. Payment and proxy delivery are not enabled."/><Feature icon={<Clock3/>} title="Check order status" text="See the status of demo orders created during your visit."/><Feature icon={<CreditCard/>} title="No live checkout" text="The current order flow is a demo; it will not charge you."/><Feature icon={<UserRound/>} title="Account tools" text="Sign in or reset your password with Supabase Auth." /></div></section>
  <section className="cta-section shell"><div className="cta-panel"><div><div className="eyebrow">BROWSE THE CATALOG</div><h2>Compare the available plans.</h2><p>Plan and price details are sample data for now.</p></div><Link className="button button-primary" to="/proxies">View plans <ArrowRight size={16}/></Link></div></section></main></>
}

function Feature({ icon, title, text }) { return <article className="feature-card"><div className="feature-icon">{icon}</div><h3>{title}</h3><p>{text}</p></article> }

function Proxies() {
  const [products, setProducts] = useState(demoProducts)
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')
  useEffect(() => { getProducts().then(data => { if (Array.isArray(data.products) && data.products.length) setProducts(data.products) }).catch(() => {}).finally(() => setLoading(false)) }, [])
  async function order(product) {
    setNotice('')
    try {
      const result = await createDemoOrder(product.id)
      const entry = {
        orderId: result.orderId,
        productId: product.id,
        productName: product.name,
        status: result.status,
        createdAt: new Date().toISOString(),
        amount: Number(product.price)
      }

      try {
        const saved = JSON.parse(localStorage.getItem('choiceproxies-demo-orders') || '[]')
        const next = [entry, ...Array.isArray(saved) ? saved : []].slice(0, 12)
        localStorage.setItem('choiceproxies-demo-orders', JSON.stringify(next))
      } catch {
        // Ignore local persistence failures in restricted storage contexts.
      }

      setNotice(`${result.message} Reference: ${result.orderId}`)
    } catch (e) {
      setNotice(e.message)
    }
  }
  return <main className="page-shell shell"><div className="page-heading"><div className="eyebrow">PROXY MARKETPLACE</div><h1>Choose your <span className="gradient-text">connection.</span></h1><p>Compare package details before choosing. Prices and products shown here are sample catalog data until your supplier is configured.</p></div>{notice && <div className="notice"><Check size={17}/>{notice}</div>}<div className="catalog-top"><span>{loading ? 'Loading plans…' : `${products.length} sample plans`}</span><span className="demo-label">DEMO CATALOG</span></div><div className="product-grid">{products.map((p, i) => <article className="product-card" key={p.id}><div className="product-card-top"><div className="product-icon"><Globe2/></div><span className="product-type">{p.type}</span></div><h3>{p.name}</h3><p>{p.description}</p><div className="product-location"><Globe2 size={15}/>{p.location}</div><div className="product-meta"><span>Protocol</span><strong>{p.protocol}</strong></div><div className="product-meta"><span>Duration</span><strong>{p.duration}</strong></div><div className="price-row"><div><strong>${Number(p.price).toFixed(2)}</strong><small> / {p.unit || 'package'}</small></div><button className="button button-primary button-small" onClick={() => order(p)}>Select plan <ArrowRight size={14}/></button></div><div className="demo-warning">Demo only · No real proxy is provisioned</div></article>)}</div><div className="info-banner"><ShieldCheck/><div><strong>Before purchasing</strong><p>These are demonstration packages. Real sales require an active proxy provider, verified payment integration, and fulfillment testing.</p></div></div></main>
}

function AuthPage({ mode, onAuth }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()
  const signup = mode === 'signup'
  async function submit(e) {
    e.preventDefault(); setMessage('')
    if (!hasSupabase) { setMessage('Authentication is not configured yet. Add your Supabase URL and publishable (or anon) key to frontend/.env.'); return }
    setBusy(true)
    try {
      const result = signup
        ? await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
        : await supabase.auth.signInWithPassword({ email, password })
      if (result.error) throw result.error
      if (signup) setMessage('Account request submitted. Check your email to verify your address before signing in.')
      else { onAuth(result.data.user); navigate('/dashboard') }
    } catch (e) { setMessage(e.message || 'Authentication failed.') }
    finally { setBusy(false) }
  }
  async function reset() {
    if (!hasSupabase) { setMessage('Configure Supabase first to enable password reset.'); return }
    if (!email) { setMessage('Enter your email address first.'); return }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
    setMessage(error ? error.message : 'If an account exists for that email, a reset link will be sent.')
  }
  return <main className="auth-shell"><section className="auth-card"><div className="auth-logo"><Logo/></div><div className="auth-heading"><div className="eyebrow">{signup ? 'CREATE YOUR ACCOUNT' : 'WELCOME BACK'}</div><h1>{signup ? 'Get started.' : 'Sign in.'}</h1><p>{signup ? 'Create your Choiceproxies account to manage orders.' : 'Access your dashboard and manage your services.'}</p></div><form onSubmit={submit} className="auth-form">{signup && <label>Full name<input required value={name} onChange={e => setName(e.target.value)} placeholder="Your name" autoComplete="name"/></label>}<label>Email address<input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"/></label><label>Password<input required minLength={8} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete={signup ? 'new-password' : 'current-password'}/></label>{!signup && <button type="button" className="text-button reset-button" onClick={reset}>Forgot password?</button>}<button disabled={busy} className="button button-primary auth-submit" type="submit">{busy ? 'Please wait…' : signup ? 'Create account' : 'Sign in'} <ArrowRight size={16}/></button></form>{message && <div className="notice auth-notice">{message}</div>}<p className="auth-switch">{signup ? 'Already have an account?' : "Don't have an account?"} <Link to={signup ? '/login' : '/signup'}>{signup ? 'Sign in' : 'Create one'}</Link></p><p className="auth-foot"><LockKeyhole size={14}/> Your account details are handled through Supabase Auth when configured.</p></section></main>
}

function Dashboard({ user }) {
  const [orders, setOrders] = useState([])
  useEffect(() => { try { const saved = JSON.parse(localStorage.getItem('choiceproxies-demo-orders') || '[]'); setOrders(saved) } catch { setOrders([]) } }, [])
  if (!user) return <main className="page-shell shell"><div className="empty-state"><div className="feature-icon"><LockKeyhole/></div><h1>Your dashboard</h1><p>Sign in to access your account. The customer dashboard becomes available after authentication is configured.</p><Link className="button button-primary" to="/login">Sign in <ArrowRight size={16}/></Link></div></main>
  return <main className="page-shell shell"><div className="dashboard-heading"><div><div className="eyebrow">CUSTOMER PORTAL</div><h1>Welcome back.</h1><p>Manage your Choiceproxies account from one place.</p></div><Link className="button button-primary" to="/proxies"><ShoppingBag size={16}/> Browse plans</Link></div><div className="dashboard-grid"><div className="metric-card"><span>Account status</span><strong className="metric-status"><span className="live-dot"/> Active session</strong><small>Signed in as {user.email}</small></div><div className="metric-card"><span>Orders on this device</span><strong>{orders.length}</strong><small>Demo order history only</small></div><div className="metric-card"><span>Active proxies</span><strong>—</strong><small>Provider not connected</small></div></div><div className="panel"><div className="panel-heading"><div><h2>Recent activity</h2><p>Your recent demo actions</p></div><Activity/></div>{orders.length ? orders.map((o, i) => <div className="activity-row" key={o.orderId || i}><span className="activity-icon"><ShoppingBag size={17}/></span><div className="activity-copy"><strong>{o.productName || 'Demo order'}</strong><small>{o.orderId} · {o.status}</small></div><span className="status-pill">{o.status}</span></div>) : <div className="empty-inline"><Boxes size={24}/><span>No orders yet. Browse the marketplace to explore available packages.</span><Link to="/proxies">Browse plans <ArrowRight size={14}/></Link></div>}</div><div className="info-banner"><ShieldCheck/><div><strong>Demo environment</strong><p>This starter dashboard does not show real payment or proxy activity. Connect Supabase tables, payment verification, and your provider before production use.</p></div></div></main>
}

function AcceptableUse() { return <main className="page-shell shell legal"><div className="eyebrow">POLICIES</div><h1>Acceptable use</h1><p>Choiceproxies services may only be used for lawful, authorized activity. Do not use them to attack systems, evade access controls, send spam, commit fraud, violate privacy, or infringe others’ rights.</p><p>Customers must follow applicable laws, provider terms, and the rules of the services they access. We may investigate abuse reports, suspend service, and respond to lawful requests.</p><p>This policy is general information, not legal advice. Have it reviewed for your business and jurisdiction before launch.</p></main> }

export default function App() {
  const [user, setUser] = useState(null)
  useEffect(() => {
    if (!hasSupabase) return
    supabase.auth.getUser().then(({ data }) => setUser(data.user || null))
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null))
    return () => data.subscription.unsubscribe()
  }, [])
  async function signOut() { if (hasSupabase) await supabase.auth.signOut(); setUser(null) }
  return <div className="app"><Header user={user} onSignOut={signOut}/><Routes><Route path="/" element={<Home/>}/><Route path="/proxies" element={<Proxies/>}/><Route path="/login" element={<AuthPage mode="login" onAuth={setUser}/>}/><Route path="/signup" element={<AuthPage mode="signup" onAuth={setUser}/>}/><Route path="/dashboard" element={<Dashboard user={user}/>}/><Route path="/acceptable-use" element={<AcceptableUse/>}/><Route path="*" element={<main className="page-shell shell empty-state"><h1>Page not found</h1><Link to="/">Return home</Link></main>}/></Routes><Footer/></div>
}
