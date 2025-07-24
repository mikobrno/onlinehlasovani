import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { BuildingProvider } from './contexts/BuildingContext';
import { MemberProvider } from './contexts/MemberContext';
import { VoteProvider } from './contexts/VoteContext';
import { EmailTemplateProvider } from './contexts/EmailTemplateContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BuildingProvider>
        <MemberProvider>
          <VoteProvider>
            <EmailTemplateProvider>
              <App />
            </EmailTemplateProvider>
          </VoteProvider>
        </MemberProvider>
      </BuildingProvider>
    </AuthProvider>
  </StrictMode>
);