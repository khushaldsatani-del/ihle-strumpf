// Centred title used by the placeholder pages until the real pages are built.
export default function PlaceholderPage({ title, children }) {
  return (
    <section className="flex min-h-[calc(100vh-var(--nav-height))] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-heading sm:text-5xl">{title}</h1>
      {children}
    </section>
  )
}
