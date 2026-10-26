import { MotionConfig } from 'motion/react'
import SmoothScroll from './components/common/SmoothScroll.jsx'
import Footer from './components/layout/Footer.jsx'
import Navbar from './components/layout/Navbar.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { CatalogProvider } from './context/CatalogContext.jsx'
import AppRoutes from './routes.jsx'

function App() {
  return (
    // reducedMotion="user": motion animations are switched off for prefers-reduced-motion
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <CatalogProvider>
          <CartProvider>
            <SmoothScroll />
            <Navbar />
            <main id="main" tabIndex={-1} className="bg-white pt-(--nav-height) outline-none">
              <AppRoutes />
            </main>
            <Footer />
          </CartProvider>
        </CatalogProvider>
      </AuthProvider>
    </MotionConfig>
  )
}

export default App
