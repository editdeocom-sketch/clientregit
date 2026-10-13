import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useEffect, type ReactNode } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { LicenseGate } from '@/components/license/LicenseGate'
import { DeepLinkBridge } from '@/components/DeepLinkBridge'
import { startNotificationEngine } from '@/lib/notifications'
import { Dashboard } from '@/pages/Dashboard'
import { Clients } from '@/pages/Clients'
import { ClientDetail } from '@/pages/ClientDetail'
import { Projects } from '@/pages/Projects'
import { ProjectDetail } from '@/pages/ProjectDetail'
import { Invoices } from '@/pages/Invoices'
import { InvoiceEditor } from '@/pages/InvoiceEditor'
import { CalendarPage } from '@/pages/CalendarPage'
import { Reports } from '@/pages/Reports'
import { ProfilePage } from '@/pages/ProfilePage'
import { SettingsPage } from '@/pages/SettingsPage'
import { MeetingsPage } from '@/pages/MeetingsPage'
import { MeetingRoom } from '@/pages/MeetingRoom'
import { MessagesPage } from '@/pages/MessagesPage'

export function App(): ReactNode {
  useEffect(() => startNotificationEngine(), [])

  return (
    <HashRouter>
      <LicenseGate>
        <DeepLinkBridge />
        <Routes>
          <Route path="/meetings/room/:code" element={<MeetingRoom />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/:id" element={<ClientDetail />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoices/new" element={<InvoiceEditor />} />
            <Route path="/invoices/:id" element={<InvoiceEditor />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/meetings" element={<MeetingsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </LicenseGate>
    </HashRouter>
  )
}
