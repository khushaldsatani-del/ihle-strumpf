import { MotionConfig } from 'motion/react'
import SmoothScroll from './components/common/SmoothScroll.jsx'
import LandingFooter from './components/landing/LandingFooter.jsx'
import LandingHeader from './components/landing/LandingHeader.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { CatalogProvider } from './context/CatalogContext.jsx'
import AppRoutes from './routes.jsx'

// Every page has the header and footer of the Ihle design (components/landing).
function App() {
  return (
    // reducedMotion="user": motion animations are switched off for prefers-reduced-motion
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <CatalogProvider>
          <CartProvider>
            <SmoothScroll />
            <LandingHeader />
            <main id="main" tabIndex={-1} className="bg-white outline-none">
              <AppRoutes />
            </main>
            <LandingFooter />
          </CartProvider>
        </CatalogProvider>
      </AuthProvider>
    </MotionConfig>
  )
}

export default App
