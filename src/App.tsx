import { Routes, Route, Navigate } from 'react-router-dom'
import { getToken } from '@/lib/api'
import { Layout } from '@/components/Layout/Layout'
import { Login } from '@/pages/Login/Login'
import { Register } from '@/pages/Register/Register'
import { Dashboard } from '@/pages/Dashboard/Dashboard'
import { Profile } from '@/pages/Profile/Profile'
import { Collection } from '@/pages/Collection/Collection'
import { RecordDetail } from '@/pages/RecordDetail/RecordDetail'
import { RecordForm } from '@/pages/RecordForm/RecordForm'
import { Friends } from '@/pages/Friends/Friends'
import { FriendCollection } from '@/pages/FriendCollection/FriendCollection'
import { FriendRecordDetail } from '@/pages/FriendRecordDetail/FriendRecordDetail'
import { Exchanges } from '@/pages/Exchanges/Exchanges'
import { ExchangeDetail } from '@/pages/ExchangeDetail/ExchangeDetail'
import './App.css'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!getToken()) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  if (getToken()) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="collection" element={<Collection />} />
        <Route path="collection/new" element={<RecordForm />} />
        <Route path="collection/:id" element={<RecordDetail />} />
        <Route path="collection/:id/edit" element={<RecordForm />} />
        <Route path="friends" element={<Friends />} />
        <Route path="friends/:userId/collection" element={<FriendCollection />} />
        <Route path="friends/:userId/collection/:recordId" element={<FriendRecordDetail />} />
        <Route path="exchanges" element={<Exchanges />} />
        <Route path="exchanges/:exchangeId" element={<ExchangeDetail />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
