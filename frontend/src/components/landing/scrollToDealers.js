// Smooth scroll to the dealer search on the home page. On other pages there is none, so the link simply opens
// /#haendler and the dealer section scrolls itself into view (LandingDealers).
export function scrollToDealers(event) {
  const target = document.getElementById('haendler')
  if (!target) return
  event?.preventDefault()
  target.scrollIntoView({ behavior: 'smooth' })
}
