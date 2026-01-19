import React, { useState, useEffect, useCallback } from 'react';
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
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Switch,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Chip,
  Tooltip,
  Divider,
  InputAdornment,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AddIcon from '@mui/icons-material/Add';
import KeyIcon from '@mui/icons-material/Key';
import { 
  fetchApiKeys, 
  createApiKey, 
  updateApiKey, 
  deleteApiKey,
  fetchCollections
} from '../services/api';

function ApiKeys() {
  const [apiKeys, setApiKeys] = useState([]);
  const [collections, setCollections] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [newKeyData, setNewKeyData] = useState({
    name: '',
    all_collections: true,
    collection_ids: [],
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [keysData, collectionsData] = await Promise.all([
        fetchApiKeys(),
        fetchCollections()
      ]);
      setApiKeys(keysData);
      setCollections(collectionsData);
    } catch (error) {
      setError(error.message);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateKey = async () => {
    try {
      if (!newKeyData.name.trim()) {
        setError('Name is required');
        return;
      }

      const createdKey = await createApiKey(newKeyData);
      setApiKeys([...apiKeys, createdKey]);
      setNewlyCreatedKey(createdKey.key);
      setOpenDialog(false);
      setNewKeyData({
        name: '',
        all_collections: true,
        collection_ids: [],
      });
      setSuccess('API key created successfully. Make sure to copy it now!');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleEditKey = async () => {
    try {
      if (!editingKey.name.trim()) {
        setError('Name is required');
        return;
      }

      const updatedKey = await updateApiKey(editingKey.id, {
        name: editingKey.name,
        all_collections: editingKey.all_collections,
        collection_ids: editingKey.collection_ids,
      });
      setApiKeys(apiKeys.map(k => k.id === editingKey.id ? updatedKey : k));
      setEditDialog(false);
      setEditingKey(null);
      setSuccess('API key updated successfully');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDeleteKey = async (keyId) => {
    if (!window.confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteApiKey(keyId);
      setApiKeys(apiKeys.filter(k => k.id !== keyId));
      setSuccess('API key deleted successfully');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleToggleKeyActive = async (key) => {
    try {
      const updatedKey = await updateApiKey(key.id, { is_active: !key.is_active });
      setApiKeys(apiKeys.map(k => k.id === key.id ? updatedKey : k));
    } catch (error) {
      setError(error.message);
    }
  };

  const handleCollectionCheckbox = (collectionId, isEdit = false) => {
    if (isEdit && editingKey) {
      const currentIds = editingKey.collection_ids || [];
      if (currentIds.includes(collectionId)) {
        setEditingKey({
          ...editingKey,
          collection_ids: currentIds.filter(id => id !== collectionId)
        });
      } else {
        setEditingKey({
          ...editingKey,
          collection_ids: [...currentIds, collectionId]
        });
      }
    } else {
      const currentIds = newKeyData.collection_ids;
      if (currentIds.includes(collectionId)) {
        setNewKeyData({
          ...newKeyData,
          collection_ids: currentIds.filter(id => id !== collectionId)
        });
      } else {
        setNewKeyData({
          ...newKeyData,
          collection_ids: [...currentIds, collectionId]
        });
      }
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getCollectionNames = (collectionIds) => {
    return collectionIds
      .map(id => collections.find(c => c.id === id)?.name)
      .filter(Boolean);
  };

  const openEditDialog = (apiKey) => {
    setEditingKey({
      ...apiKey,
      collection_ids: apiKey.collection_ids || []
    });
    setEditDialog(true);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        {/* API Keys Section */}
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h5" gutterBottom>
                API Keys
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage API keys for accessing your collections via the Go proxy API.
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              Create API Key
            </Button>
          </Box>

          {/* Newly Created Key Display */}
          {newlyCreatedKey && (
            <Alert 
              severity="success" 
              sx={{ mb: 3 }}
              onClose={() => setNewlyCreatedKey(null)}
            >
              <Typography variant="subtitle2" gutterBottom>
                Your new API key (copy it now, it won't be shown again):
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  value={newlyCreatedKey}
                  size="small"
                  fullWidth
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => copyToClipboard(newlyCreatedKey)} size="small">
                          <ContentCopyIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Alert>
          )}

          <List>
            {apiKeys.map((apiKey) => (
              <ListItem key={apiKey.id} divider>
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                  <KeyIcon color={apiKey.is_active ? "primary" : "disabled"} />
                </Box>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1">{apiKey.name}</Typography>
                      {!apiKey.is_active && (
                        <Chip label="Inactive" size="small" color="default" />
                      )}
                      <Tooltip title="Total requests made with this key">
                        <Chip 
                          label={`${formatNumber(apiKey.request_count || 0)} requests`} 
                          size="small" 
                          color="info" 
                          variant="outlined"
                        />
                      </Tooltip>
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Key: {apiKey.key.substring(0, 15)}...
                        <Tooltip title="Copy full key">
                          <IconButton size="small" onClick={() => copyToClipboard(apiKey.key)}>
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Created: {formatDate(apiKey.created_at)} | Last used: {formatDate(apiKey.last_used_at)}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        {apiKey.all_collections ? (
                          <Chip label="All Collections" size="small" color="primary" variant="outlined" />
                        ) : (
                          getCollectionNames(apiKey.collection_ids).map((name, idx) => (
                            <Chip 
                              key={idx} 
                              label={name} 
                              size="small" 
                              variant="outlined" 
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))
                        )}
                        {!apiKey.all_collections && apiKey.collection_ids.length === 0 && (
                          <Chip label="No collections" size="small" color="warning" variant="outlined" />
                        )}
                      </Box>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={apiKey.is_active}
                          onChange={() => handleToggleKeyActive(apiKey)}
                          color="primary"
                        />
                      }
                      label=""
                    />
                    <Tooltip title="Edit">
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={() => openEditDialog(apiKey)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDeleteKey(apiKey.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
            {apiKeys.length === 0 && (
              <ListItem>
                <ListItemText 
                  primary="No API keys yet"
                  secondary="Create an API key to access your collections via the proxy API"
                />
              </ListItem>
            )}
          </List>
        </Paper>
      </Box>

      {/* Create API Key Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New API Key</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Key Name"
            fullWidth
            value={newKeyData.name}
            onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
            placeholder="My API Key"
            helperText="A friendly name to identify this key"
            sx={{ mb: 3 }}
          />
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            Collection Access
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={newKeyData.all_collections}
                onChange={(e) => setNewKeyData({ 
                  ...newKeyData, 
                  all_collections: e.target.checked,
                  collection_ids: e.target.checked ? [] : newKeyData.collection_ids
                })}
              />
            }
            label="Access all collections"
          />
          
          {!newKeyData.all_collections && (
            <Box sx={{ mt: 2, ml: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Select specific collections:
              </Typography>
              <FormGroup>
                {collections.map((collection) => (
                  <FormControlLabel
                    key={collection.id}
                    control={
                      <Checkbox
                        checked={newKeyData.collection_ids.includes(collection.id)}
                        onChange={() => handleCollectionCheckbox(collection.id, false)}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {collection.name}
                        {collection.is_active === false && (
                          <Chip label="Inactive" size="small" />
                        )}
                      </Box>
                    }
                  />
                ))}
                {collections.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No collections available
                  </Typography>
                )}
              </FormGroup>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateKey} variant="contained">
            Create Key
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit API Key Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit API Key</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Key Name"
            fullWidth
            value={editingKey?.name || ''}
            onChange={(e) => setEditingKey({ ...editingKey, name: e.target.value })}
            placeholder="My API Key"
            helperText="A friendly name to identify this key"
            sx={{ mb: 3 }}
          />

          {editingKey && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Key:</strong> {editingKey.key?.substring(0, 20)}...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Requests:</strong> {formatNumber(editingKey.request_count || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Created:</strong> {formatDate(editingKey.created_at)}
              </Typography>
            </Box>
          )}
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            Collection Access
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={editingKey?.all_collections || false}
                onChange={(e) => setEditingKey({ 
                  ...editingKey, 
                  all_collections: e.target.checked,
                  collection_ids: e.target.checked ? [] : (editingKey?.collection_ids || [])
                })}
              />
            }
            label="Access all collections"
          />
          
          {editingKey && !editingKey.all_collections && (
            <Box sx={{ mt: 2, ml: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Select specific collections:
              </Typography>
              <FormGroup>
                {collections.map((collection) => (
                  <FormControlLabel
                    key={collection.id}
                    control={
                      <Checkbox
                        checked={(editingKey.collection_ids || []).includes(collection.id)}
                        onChange={() => handleCollectionCheckbox(collection.id, true)}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {collection.name}
                        {collection.is_active === false && (
                          <Chip label="Inactive" size="small" />
                        )}
                      </Box>
                    }
                  />
                ))}
                {collections.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No collections available
                  </Typography>
                )}
              </FormGroup>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleEditKey} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars */}
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
        autoHideDuration={4000}
        onClose={() => setSuccess(null)}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default ApiKeys;
