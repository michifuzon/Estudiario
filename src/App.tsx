import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '@/app/providers/ThemeProvider'
import { AuthProvider } from '@/app/providers/AuthProvider'
import { AuthGate } from '@/features/auth/AuthGate'
import { AppShell } from '@/app/layout/AppShell'
import { HomeScreen } from '@/features/home/HomeScreen'
import { CalendarScreen } from '@/features/calendar/CalendarScreen'
import { SubjectsListScreen } from '@/features/subjects/SubjectsListScreen'
import { SubjectDetailScreen } from '@/features/subjects/SubjectDetailScreen'
import { SubjectOverviewTab } from '@/features/subjects/tabs/SubjectOverviewTab'
import { SubjectChatTab } from '@/features/subjects/tabs/SubjectChatTab'
import { SubjectFilesTab } from '@/features/subjects/tabs/SubjectFilesTab'
import { SubjectGradesTab } from '@/features/subjects/tabs/SubjectGradesTab'
import { SubjectPlanTab } from '@/features/subjects/tabs/SubjectPlanTab'
import { InboxScreen } from '@/features/subjects/InboxScreen'
import { PlannerScreen } from '@/features/planner/PlannerScreen'
import { AssistantScreen } from '@/features/assistant/AssistantScreen'
import { SettingsScreen } from '@/features/settings/SettingsScreen'
import { AdminScreen } from '@/features/admin/AdminScreen'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AuthGate>
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<HomeScreen />} />
                <Route path="calendario" element={<CalendarScreen />} />
                <Route path="materias" element={<SubjectsListScreen />} />
                <Route path="materias/:subjectId" element={<SubjectDetailScreen />}>
                  <Route index element={<SubjectOverviewTab />} />
                  <Route path="chat" element={<SubjectChatTab />} />
                  <Route path="archivos" element={<SubjectFilesTab />} />
                  <Route path="calificaciones" element={<SubjectGradesTab />} />
                  <Route path="plan" element={<SubjectPlanTab />} />
                </Route>
                <Route path="bandeja" element={<InboxScreen />} />
                <Route path="plan" element={<PlannerScreen />} />
                <Route path="asistente" element={<AssistantScreen />} />
                <Route path="configuracion" element={<SettingsScreen />} />
                <Route path="admin" element={<AdminScreen />} />
              </Route>
            </Routes>
          </AuthGate>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
