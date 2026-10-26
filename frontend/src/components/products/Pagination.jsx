import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import SortDropdown from './SortDropdown.jsx'

// Page numbers to show: always the first and last page, the current page and its neighbours; '…' marks a gap.
function pageList(page, pageCount) {
  const wanted = new Set([1, pageCount, page - 1, page, page + 1])
  const pages = [...wanted].filter((number) => number >= 1 && number <= pageCount).sort((a, b) => a - b)
  return pages.flatMap((number, index) => (index > 0 && number - pages[index - 1] > 1 ? ['…', number] : [number]))
}

/**
 * Page navigation below the product list: "1–8 of 12", products per page, and the page numbers.
 * page starts at 1. onPage(number) and onPageSize(number) report the choices.
 */
export default function Pagination({ page, pageSize, pageSizes, total, onPage, onPageSize }) {
  const { t } = useTranslation()
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="pagination">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <p aria-live="polite">{t('products.range', { from, to, total })}</p>
        <SortDropdown
          label={t('products.show')}
          value={pageSize}
          options={pageSizes.map((size) => ({ value: size, label: String(size) }))}
          onChange={onPageSize}
          openUp
        />
      </div>

      <nav aria-label={t('products.pages.label')} className="flex items-center gap-1">
        <button
          type="button"
          className="page-btn"
          aria-label={t('products.pages.previous')}
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>

        {pageList(page, pageCount).map((item, index) =>
          item === '…' ? (
            <span key={`gap-${index}`} aria-hidden="true" className="px-1 text-body">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className="page-btn"
              aria-label={t('products.pages.page', { page: item })}
              aria-current={item === page ? 'page' : undefined}
              onClick={() => onPage(item)}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          className="page-btn"
          aria-label={t('products.pages.next')}
          disabled={page >= pageCount}
          onClick={() => onPage(page + 1)}
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </nav>
    </div>
  )
}
