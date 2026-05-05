import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from "react-router-dom";
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import customTheme from './theme/customTheme.js'
import AuthProvider from './auth/AuthProvider.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={customTheme}>
      <AuthProvider>
        <BrowserRouter>
          <CssBaseline />
          <App />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);
