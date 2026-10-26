import { useId, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown } from 'lucide-react'

// One collapsible part of the filter panel (open by default).
export default function FilterSection({ title, children }) {
  const id = useId()
  const [open, setOpen] = useState(true)

  return (
    <section className="filter-section">
      <h3>
        <button
          type="button"
          className="filter-section__toggle"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((value) => !value)}
        >
          {title}
          <ChevronDown size={16} aria-hidden="true" className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            {/* the padding keeps focus rings inside the clipped area */}
            <div className="px-1 pb-5 pt-0.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
