
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search,
  ArrowUpRight,
  BookOpen,
  Calculator,
  Headphones,
  Laptop,
  Compass,
  Users,
  Share2,
} from 'lucide-react'

const products = [
  { name: 'Scientific Calculator', category: 'Electronics', price: '₹15/day', icon: Calculator },
  { name: 'Engineering Textbook', category: 'Books', price: '₹10/day', icon: BookOpen },
  { name: 'Wireless Headphones', category: 'Accessories', price: '₹25/day', icon: Headphones },
  { name: 'Laptop Stand', category: 'Accessories', price: '₹20/day', icon: Laptop },
]

const steps = [
  {
    number: '01',
    title: 'Explore',
    description: 'Discover useful items, lost belongings, campus events, and student opportunities.',
    icon: Compass,
  },
  {
    number: '02',
    title: 'Connect',
    description: 'Connect with fellow students, contact owners, and send requests.',
    icon: Users,
  },
  {
    number: '03',
    title: 'Share',
    description: 'Rent, sell, exchange, or give away things within your campus community.',
    icon: Share2,
  },
]

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const query = searchQuery.trim()

    if (!query) {
      navigate('/marketplace')
      return
    }

    navigate(`/marketplace?search=${encodeURIComponent(query)}`)
  }

  const handleExplore = () => {
    navigate('/marketplace')
  }

  return (
    <main
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
      className="min-h-screen transition-colors duration-300"
    >
      {/* HERO SECTION */}
      <section className="px-6 md:px-16 py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl"
        >
          <span
            className="text-sm font-medium tracking-widest uppercase"
            style={{ color: 'var(--accent)' }}
          >
            Your campus. Your community.
          </span>

          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight mt-5 leading-tight">
            Good things are
            <br />
            <span style={{ color: 'var(--accent)' }}>
              meant to be shared.
            </span>
          </h1>

          <p
            className="text-lg mt-6 max-w-xl leading-relaxed"
            style={{ color: 'var(--muted)' }}
          >
            Rent what you need, find what you've lost, and connect with
            people who make campus life better.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row gap-3 max-w-xl">
            <form
              onSubmit={handleSearch}
              className="flex items-center gap-3 rounded-full px-5 py-4 flex-1 border"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
            >
              <Search size={20} style={{ color: 'var(--muted)' }} />

              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What are you looking for?"
                aria-label="Search marketplace items"
                className="outline-none w-full text-sm bg-transparent"
              />

              <button type="submit" className="sr-only">
                Search
              </button>
            </form>

            <button
              onClick={handleExplore}
              className="bg-[#24364b] text-white px-8 py-4 rounded-full hover:bg-[#354b64] transition-colors"
            >
              Explore
            </button>
          </div>

          <p className="text-xs mt-4" style={{ color: 'var(--muted)' }}>
            Made for students, powered by students.
          </p>
        </motion.div>
      </section>

      {/* DISCOVER SECTION */}
      <section className="px-6 md:px-16 pb-20">
        <div className="mb-8">
          <p
            className="text-sm font-medium tracking-widest uppercase"
            style={{ color: 'var(--accent)' }}
          >
            DISCOVER CAMPUS ESSENTIALS
          </p>

          <h2 className="text-3xl font-semibold mt-2">
            A little help goes a long way.
          </h2>

          <p className="text-sm mt-3" style={{ color: 'var(--muted)' }}>
            Find useful things shared by students in your campus community.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {products.map((product, index) => {
            const Icon = product.icon

            return (
              <motion.div
                key={product.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.12 }}
                className="rounded-2xl p-5 border hover:shadow-md transition-colors"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                <div
                  className="h-40 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: 'var(--bg)' }}
                >
                  <Icon
                    size={65}
                    strokeWidth={1.2}
                    style={{ color: 'var(--accent)' }}
                  />
                </div>

                <p
                  className="text-xs mt-5"
                  style={{ color: 'var(--muted)' }}
                >
                  {product.category}
                </p>

                <h3 className="font-medium mt-1">
                  {product.name}
                </h3>

                <div className="flex justify-between items-center mt-4">
                  <span
                    className="text-sm font-semibold"
                    style={{ color: 'var(--accent)' }}
                  >
                    {product.price}
                  </span>

                  <ArrowUpRight
                    size={18}
                    style={{ color: 'var(--muted)' }}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* HOW BORRO WORKS */}
      <section
        id="how-borro-works"
        className="px-6 md:px-16 py-20 border-t"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="max-w-2xl mb-12">
          <p
            className="text-sm font-medium tracking-widest uppercase"
            style={{ color: 'var(--accent)' }}
          >
            SIMPLE AS THAT
          </p>

          <h2 className="text-3xl md:text-4xl font-semibold mt-3">
            How Borro works.
          </h2>

          <p className="mt-4 leading-relaxed" style={{ color: 'var(--muted)' }}>
            Making campus life easier starts with three simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon

            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
                className="rounded-2xl border p-7"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-sm font-semibold"
                    style={{ color: 'var(--accent)' }}
                  >
                    {step.number}
                  </span>

                  <Icon
                    size={25}
                    strokeWidth={1.5}
                    style={{ color: 'var(--accent)' }}
                  />
                </div>

                <h3 className="text-xl font-semibold mt-8">
                  {step.title}
                </h3>

                <p
                  className="text-sm leading-relaxed mt-3"
                  style={{ color: 'var(--muted)' }}
                >
                  {step.description}
                </p>
              </motion.div>
            )
          })}
        </div>
      </section>
    </main>
  )
}
