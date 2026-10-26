import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AdminLayout from './components/layout/AdminLayout.jsx'
import AuthProvider from './context/AuthProvider.jsx'
import DataProvider from './context/DataProvider.jsx'
import { useAuth } from './context/contexts.js'
import CustomerDetail from './pages/CustomerDetail.jsx'
import Customers from './pages/Customers.jsx'
import Import from './pages/Import.jsx'
import Login from './pages/Login.jsx'
import NotFound from './pages/NotFound.jsx'
import OrderDetail from './pages/OrderDetail.jsx'
import Orders from './pages/Orders.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import Products from './pages/Products.jsx'

// Every admin page needs a login; after logging in, the admin lands on the page they asked for.
// The data is only loaded once someone is logged in.
function RequireAuth({ children }) {
  const { user, checking } = useAuth()
  const location = useLocation()
  if (checking) return null
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <DataProvider>{children}</DataProvider>
}

// Phase 1 scope (Ihle's brief): check imported articles, customers and orders, with search and filters
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/orders" replace />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:orderNo" element={<OrderDetail />} />
          <Route path="customers" element={<Customers />} />
          <Route path="customers/:number" element={<CustomerDetail />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="import" element={<Import />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
