import Colors from '../components/home/Colors.jsx'
import DealerFinder from '../components/home/DealerFinder.jsx'
import Hero from '../components/home/Hero.jsx'
import Highlights from '../components/home/Highlights.jsx'
import Ranges from '../components/home/Ranges.jsx'
import SockShapes from '../components/home/SockShapes.jsx'

// Home page: hero, highlights, the product ranges, sock shapes, colours and the retailer finder.
export default function Home() {
  return (
    <>
      <Hero />
      <Highlights />
      <Ranges />
      <SockShapes />
      <Colors />
      <DealerFinder />
    </>
  )
}
