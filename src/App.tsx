import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import { AuthProvider } from './auth';
import { LangProvider } from './i18n';

/**
 * Providers + router. The route tree itself lives in AppRoutes.tsx so tests can
 * drive it with a MemoryRouter. Auth is a page (/login), not a modal —
 * docs/ARCHITECTURE.md rev 1.3.
 */
export default function App() {
  return (
    <BrowserRouter>
      <LangProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </LangProvider>
    </BrowserRouter>
  );
}
