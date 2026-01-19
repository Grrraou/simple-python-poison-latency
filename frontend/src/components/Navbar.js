import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
} from '@mui/material';

function Navbar({ user, setUser }) {
  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <img
            src="/icon.png"
            alt="Latency Poison Logo"
            style={{ height: '40px', marginRight: '16px' }}
          />
          <Typography variant="h6" component="div">
            Latency Poison
          </Typography>
        </Box>
        <Box>
          {user ? (
            <>
              <Button color="inherit" component={RouterLink} to="/">
                Dashboard
              </Button>
              <Button color="inherit" component={RouterLink} to="/sandbox">
                Sandbox
              </Button>
              <Button color="inherit" component={RouterLink} to="/endpoints">
                Endpoints
              </Button>
              <Button color="inherit" component={RouterLink} to="/api-keys">
                API Keys
              </Button>
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/login">
                Login
              </Button>
              <Button color="inherit" component={RouterLink} to="/register">
                Register
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar; 