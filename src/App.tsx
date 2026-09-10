import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import AuthSheet from './components/home/AuthSheet';
import { AuthProvider, useAuth } from './auth';
import { LangProvider } from './i18n';

/**
 * Providers + router. The route tree itself lives in AppRoutes.tsx so tests can
 * drive it with a MemoryRouter. Structure: docs/ARCHITECTURE.md.
 */

/** One auth sheet for the whole app, so the gate works on every route. */
function GlobalAuthSheet() {
  const { authOpen, closeAuth, completeAuth } = useAuth();
  if (!authOpen) return null;
  return <AuthSheet onClose={closeAuth} onContinue={completeAuth} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <LangProvider>
        <AuthProvider>
          <AppRoutes />
          <GlobalAuthSheet />
        </AuthProvider>
      </LangProvider>
    </BrowserRouter>
  );
}
