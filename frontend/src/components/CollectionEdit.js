import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Slider,
  Grid,
  Switch,
  Chip,
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { fetchCollection, fetchEndpoints, createEndpoint, updateEndpoint, deleteEndpoint } from '../services/api';

function CollectionEdit() {
  const { collectionId } = useParams();
  const [collection, setCollection] = useState(null);
  const [endpoints, setEndpoints] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState(null);
  const [newEndpoint, setNewEndpoint] = useState({
    name: '',
    url: '',
    method: 'GET',
    latency_ms: null,
    fail_rate: null,
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [collectionData, endpointsData] = await Promise.all([
        fetchCollection(collectionId),
        fetchEndpoints(collectionId)
      ]);
      setCollection(collectionData);
      setEndpoints(endpointsData);
    } catch (error) {
      setError(error.message);
    }
  }, [collectionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateEndpoint = async () => {
    try {
      if (!newEndpoint.name.trim() || !newEndpoint.url.trim()) {
        setError('Name and URL are required');
        return;
      }

      const endpointData = {
        name: newEndpoint.name,
        url: newEndpoint.url,
        method: newEndpoint.method,
        min_latency: newEndpoint.latency_ms || 0,
        max_latency: newEndpoint.latency_ms || 1000,
        fail_rate: newEndpoint.fail_rate || 0,
        collection_id: parseInt(collectionId)
      };

      const createdEndpoint = await createEndpoint(collectionId, endpointData);
      setEndpoints([...endpoints, createdEndpoint]);
      setOpenDialog(false);
      setNewEndpoint({
        name: '',
        url: '',
        method: 'GET',
        latency_ms: null,
        fail_rate: null,
      });
      setSuccess('Endpoint created successfully');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleEditEndpoint = async () => {
    try {
      if (!editingEndpoint.name.trim()) {
        setError('Name cannot be empty');
        return;
      }

      const updatedEndpoint = await updateEndpoint(editingEndpoint.id, {
        name: editingEndpoint.name,
        url: editingEndpoint.url,
        method: editingEndpoint.method,
        min_latency: editingEndpoint.min_latency,
        max_latency: editingEndpoint.max_latency,
        fail_rate: editingEndpoint.fail_rate,
      });

      setEndpoints(endpoints.map(e => 
        e.id === updatedEndpoint.id ? updatedEndpoint : e
      ));
      setEditDialog(false);
      setEditingEndpoint(null);
      setSuccess('Endpoint updated successfully');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDeleteEndpoint = async (endpointId) => {
    try {
      await deleteEndpoint(endpointId);
      setEndpoints(endpoints.filter(e => e.id !== endpointId));
      setSuccess('Endpoint deleted successfully');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleToggleEndpointActive = async (endpoint) => {
    try {
      const updatedEndpoint = await updateEndpoint(endpoint.id, {
        is_active: !endpoint.is_active
      });
      setEndpoints(endpoints.map(e => 
        e.id === updatedEndpoint.id ? updatedEndpoint : e
      ));
    } catch (error) {
      setError(error.message);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return (num || 0).toString();
  };

  if (!collection) {
    return <Box>Loading...</Box>;
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h4" component="h1">
                {collection.name}
              </Typography>
              {collection.description && (
                <Typography variant="body1" color="text.secondary">
                  {collection.description}
                </Typography>
              )}
            </Box>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setOpenDialog(true)}
            >
              Add Path
            </Button>
          </Box>

          <List>
            {endpoints.map((endpoint) => (
              <ListItem
                key={endpoint.id}
                sx={{
                  opacity: endpoint.is_active === false ? 0.6 : 1,
                  borderLeft: endpoint.is_active === false ? '3px solid grey' : '3px solid #90caf9',
                  mb: 1,
                  bgcolor: 'background.paper',
                }}
                secondaryAction={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Tooltip title={endpoint.is_active ? "Deactivate" : "Activate"}>
                      <Switch
                        checked={endpoint.is_active !== false}
                        onChange={() => handleToggleEndpointActive(endpoint)}
                        color="primary"
                        size="small"
                      />
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={() => {
                          setEditingEndpoint({ ...endpoint });
                          setEditDialog(true);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDeleteEndpoint(endpoint.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1">{endpoint.name}</Typography>
                      {endpoint.is_active === false && (
                        <Chip label="Inactive" size="small" color="default" />
                      )}
                      <Tooltip title="Total requests">
                        <Chip 
                          label={`${formatNumber(endpoint.request_count)} requests`} 
                          size="small" 
                          color="info" 
                          variant="outlined"
                        />
                      </Tooltip>
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="text.secondary">
                        {endpoint.method} {endpoint.url}
                      </Typography>
                      <br />
                      <Typography component="span" variant="body2" color="text.primary">
                        Latency: {endpoint.min_latency}-{endpoint.max_latency}ms
                      </Typography>
                      {' — '}
                      <Typography component="span" variant="body2" color="text.primary">
                        Fail Rate: {endpoint.fail_rate}%
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Add New Endpoint</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                margin="dense"
                label="Name"
                fullWidth
                value={newEndpoint.name}
                onChange={(e) => setNewEndpoint({ ...newEndpoint, name: e.target.value })}
                placeholder="User API"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="dense"
                label="URL"
                fullWidth
                value={newEndpoint.url}
                onChange={(e) => setNewEndpoint({ ...newEndpoint, url: e.target.value })}
                placeholder="https://api.example.com/users"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="dense"
                label="Method"
                fullWidth
                select
                value={newEndpoint.method}
                onChange={(e) => setNewEndpoint({ ...newEndpoint, method: e.target.value })}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <Typography gutterBottom>Latency (ms)</Typography>
              <Slider
                value={newEndpoint.latency_ms || 0}
                onChange={(e, value) => setNewEndpoint({ ...newEndpoint, latency_ms: value })}
                min={0}
                max={10000}
                step={100}
                valueLabelDisplay="auto"
              />
            </Grid>
            <Grid item xs={6}>
              <Typography gutterBottom>Fail Rate (%)</Typography>
              <Slider
                value={newEndpoint.fail_rate || 0}
                onChange={(e, value) => setNewEndpoint({ ...newEndpoint, fail_rate: value })}
                min={0}
                max={100}
                step={1}
                valueLabelDisplay="auto"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateEndpoint} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Endpoint</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                margin="dense"
                label="Name"
                fullWidth
                value={editingEndpoint?.name || ''}
                onChange={(e) => setEditingEndpoint({ ...editingEndpoint, name: e.target.value })}
                placeholder="User API"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="dense"
                label="URL"
                fullWidth
                value={editingEndpoint?.url || ''}
                onChange={(e) => setEditingEndpoint({ ...editingEndpoint, url: e.target.value })}
                placeholder="https://api.example.com/users"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="dense"
                label="Method"
                fullWidth
                select
                value={editingEndpoint?.method || 'GET'}
                onChange={(e) => setEditingEndpoint({ ...editingEndpoint, method: e.target.value })}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <Typography gutterBottom>Min Latency (ms): {editingEndpoint?.min_latency || 0}</Typography>
              <Slider
                value={editingEndpoint?.min_latency || 0}
                onChange={(e, value) => setEditingEndpoint({ ...editingEndpoint, min_latency: value })}
                min={0}
                max={10000}
                step={100}
                valueLabelDisplay="auto"
              />
            </Grid>
            <Grid item xs={6}>
              <Typography gutterBottom>Max Latency (ms): {editingEndpoint?.max_latency || 1000}</Typography>
              <Slider
                value={editingEndpoint?.max_latency || 1000}
                onChange={(e, value) => setEditingEndpoint({ ...editingEndpoint, max_latency: value })}
                min={0}
                max={10000}
                step={100}
                valueLabelDisplay="auto"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography gutterBottom>Fail Rate (%): {editingEndpoint?.fail_rate || 0}</Typography>
              <Slider
                value={editingEndpoint?.fail_rate || 0}
                onChange={(e, value) => setEditingEndpoint({ ...editingEndpoint, fail_rate: value })}
                min={0}
                max={100}
                step={1}
                valueLabelDisplay="auto"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleEditEndpoint} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default CollectionEdit; 