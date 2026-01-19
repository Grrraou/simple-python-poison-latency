import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';

// Components
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import Endpoints from './components/Endpoints';
import Dashboard from './components/Dashboard';
import QuickSandbox from './components/QuickSandbox';
import CollectionEdit from './components/CollectionEdit';
import ApiKeys from './components/ApiKeys';
import Landing from './components/Landing';
import Documentation from './components/Documentation';
import { UserProvider } from './contexts/UserContext';

// Create a theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
  },
});

// Private route wrapper
function PrivateRoute({ user, children }) {
  return user ? children : <Navigate to="/login" />;
}

function AppContent({ user, setUser }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar user={user} setUser={setUser} />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/dashboard" />} />
          <Route path="/register" element={!user ? <Register setUser={setUser} /> : <Navigate to="/dashboard" />} />
          <Route path="/sandbox" element={<QuickSandbox />} />
          <Route path="/docs" element={<Documentation />} />
          
          {/* Private routes */}
          <Route path="/dashboard" element={<PrivateRoute user={user}><Dashboard /></PrivateRoute>} />
          <Route path="/endpoints" element={<PrivateRoute user={user}><Endpoints /></PrivateRoute>} />
          <Route path="/api-keys" element={<PrivateRoute user={user}><ApiKeys /></PrivateRoute>} />
          <Route path="/collections/:collectionId" element={<PrivateRoute user={user}><CollectionEdit /></PrivateRoute>} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Box>
    </Box>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      // TODO: Verify token with backend
      setUser({ token });
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <Box>Loading...</Box>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <UserProvider>
        <AppContent user={user} setUser={setUser} />
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
