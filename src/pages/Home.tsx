
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
} from 'lucide-react'

const products = [
  { name: 'Scientific Calculator', category: 'Electronics', price: '₹15/day', icon: Calculator },
  { name: 'Engineering Textbook', category: 'Books', price: '₹10/day', icon: BookOpen },
  { name: 'Wireless Headphones', category: 'Accessories', price: '₹25/day', icon: Headphones },
  { name: 'Laptop Stand', category: 'Accessories', price: '₹20/day', icon: Laptop },
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

              <button
                type="submit"
                className="sr-only"
              >
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

      <section className="px-6 md:px-16 pb-24">
        <div className="flex justify-between items-end mb-8">
          <div>
            <p
              className="text-sm font-medium"
              style={{ color: 'var(--accent)' }}
            >
              BORRO MARKETPLACE
            </p>
            <h2 className="text-3xl font-semibold mt-2">
              Find what you need.
            </h2>
          </div>

          <a
            href="/marketplace"
            className="hidden sm:flex items-center gap-2 text-sm"
          >
            View all <ArrowUpRight size={17} />
          </a>
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
    </main>
  )
}
