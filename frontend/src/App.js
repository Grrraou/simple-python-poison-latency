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
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar user={user} setUser={setUser} />
          <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Routes>
              <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
              <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/" />} />
              <Route path="/register" element={!user ? <Register setUser={setUser} /> : <Navigate to="/" />} />
              <Route path="/endpoints" element={user ? <Endpoints /> : <Navigate to="/login" />} />
              <Route path="/sandbox" element={user ? <QuickSandbox /> : <Navigate to="/login" />} />
              <Route path="/api-keys" element={user ? <ApiKeys /> : <Navigate to="/login" />} />
              <Route path="/collections/:collectionId" element={<CollectionEdit />} />
            </Routes>
          </Box>
        </Box>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App; 