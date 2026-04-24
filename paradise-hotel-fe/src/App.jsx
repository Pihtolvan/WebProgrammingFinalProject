import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'

import HomePage from './pages/HomePage.jsx'
import AboutPage from './pages/AboutPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SearchRoomsPage from './pages/SearchRoomsPage.jsx'
import MyReservationsPage from './pages/MyReservationsPage.jsx'
import RequireAuth from './auth/RequireAuth.jsx'

import RequireAdmin from './auth/RequireAdmin.jsx'
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path='/' element={<HomePage />} />
        <Route path='/about' element={<AboutPage />} />
        <Route path='/register' element={<RegisterPage />} />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/search' element={<SearchRoomsPage />} />

        <Route
          path='/reservations'
          element={
            <RequireAuth>
              <MyReservationsPage />
            </RequireAuth>
          }
        />
        <Route path='/admin' element={<RequireAdmin />}>
          <Route path='dashboard' element={<AdminDashboardPage />} />
        </Route>
      </Route>
    </Routes>
  )
}