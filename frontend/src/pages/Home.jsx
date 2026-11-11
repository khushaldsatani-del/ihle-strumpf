import Ranges from '../components/home/Ranges.jsx'
import LandingColors from '../components/landing/LandingColors.jsx'
import LandingDealers from '../components/landing/LandingDealers.jsx'
import LandingHero from '../components/landing/LandingHero.jsx'

// Home page in the new Ihle corporate design (components/landing): hero, the product ranges, colours and the
// retailer finder. Highlights (LandingHighlights) are left out for now at Ihle's request (add it again after
// <Ranges /> to bring it back); the sock shapes are on the material page now. "Our ranges" keeps its accordion,
// with the landing page's fonts and colours.
export default function Home() {
  return (
    <>
      <div className="lp">
        <LandingHero />
        <Ranges />
        <LandingColors />
        <LandingDealers />
      </div>
    </>
  )
}
