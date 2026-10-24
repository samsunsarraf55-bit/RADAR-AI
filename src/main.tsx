import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './context/ThemeContext';
import { SortProvider } from './context/SortContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <ThemeProvider>
      <SortProvider>
        <App />
      </SortProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

