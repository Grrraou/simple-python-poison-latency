import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AddIcon from '@mui/icons-material/Add';
import KeyIcon from '@mui/icons-material/Key';
import {
  fetchConfigKeys,
  createConfigKey,
  updateConfigKey,
  deleteConfigKey,
} from '../services/api';
import { PROXY_API_BASE_URL } from '../config';

const METHOD_OPTIONS = ['ANY', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
const DEFAULT_ERROR_CODES = [500, 503];

function Configs() {
  const [configKeys, setConfigKeys] = useState([]);
  const [selectedKeyId, setSelectedKeyId] = useState(null);
  const [keyDialog, setKeyDialog] = useState(false);
  const [keyForm, setKeyForm] = useState({
    name: '',
    target_url: '',
    fail_rate: 0,
    min_latency: 0,
    max_latency: 0,
    method: 'ANY',
    error_codes: [],
  });
  const [errorCodeInput, setErrorCodeInput] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [newKeyReveal, setNewKeyReveal] = useState(null);

  const loadKeys = useCallback(async () => {
    try {
      const data = await fetchConfigKeys();
      setConfigKeys(data);
      if (data.length && !selectedKeyId) setSelectedKeyId(data[0].id);
    } catch (e) {
      setSnackbar({ open: true, message: e.message || 'Failed to load keys', severity: 'error' });
    }
  }, [selectedKeyId]);

  useEffect(() => { loadKeys(); }, [loadKeys]);

  const selectedKey = configKeys.find(k => k.id === selectedKeyId);

  const keyFormForEdit = selectedKey ? {
    name: selectedKey.name,
    target_url: selectedKey.target_url || '',
    fail_rate: selectedKey.fail_rate ?? 0,
    min_latency: selectedKey.min_latency ?? 0,
    max_latency: selectedKey.max_latency ?? 0,
    method: selectedKey.method || 'ANY',
    error_codes: selectedKey.error_codes && selectedKey.error_codes.length ? selectedKey.error_codes : [],
  } : null;

  const handleAddErrorCode = (form, setForm) => {
    const n = parseInt(errorCodeInput, 10);
    if (isNaN(n) || n < 100 || n > 599) return;
    if (form.error_codes.includes(n)) return;
    setForm(f => ({ ...f, error_codes: [...f.error_codes, n].sort((a, b) => a - b) }));
    setErrorCodeInput('');
  };

  const handleRemoveErrorCode = (form, setForm, code) => {
    setForm(f => ({ ...f, error_codes: f.error_codes.filter(c => c !== code) }));
  };

  const handleCreateKey = async () => {
    if (!keyForm.name.trim()) return;
    try {
      const created = await createConfigKey({
        name: keyForm.name.trim(),
        target_url: keyForm.target_url.trim() || null,
        fail_rate: Math.max(0, Math.min(100, keyForm.fail_rate)),
        min_latency: keyForm.min_latency || 0,
        max_latency: keyForm.max_latency || 0,
        method: keyForm.method || 'ANY',
        error_codes: keyForm.error_codes.length ? keyForm.error_codes : [],
      });
      setConfigKeys(prev => [...prev, created]);
      setNewKeyReveal(created.key);
      setKeyForm({ name: '', target_url: '', fail_rate: 0, min_latency: 0, max_latency: 0, method: 'ANY', error_codes: [] });
      setKeyDialog(false);
      setSnackbar({ open: true, message: 'Config key created. Copy it and set target URL.', severity: 'success' });
    } catch (e) {
      setSnackbar({ open: true, message: e.message || 'Failed to create key', severity: 'error' });
    }
  };

  const handleToggleKeyActive = async (key) => {
    try {
      const updated = await updateConfigKey(key.id, {
        name: key.name,
        is_active: !key.is_active,
        target_url: key.target_url,
        fail_rate: key.fail_rate,
        min_latency: key.min_latency,
        max_latency: key.max_latency,
        method: key.method,
        error_codes: key.error_codes || [],
      });
      setConfigKeys(prev => prev.map(k => k.id === key.id ? updated : k));
      setSnackbar({ open: true, message: updated.is_active ? 'Key enabled' : 'Key disabled', severity: 'success' });
    } catch (e) {
      setSnackbar({ open: true, message: e.message || 'Failed to update key', severity: 'error' });
    }
  };

  const handleDeleteKey = async (key) => {
    if (!window.confirm('Delete this config key?')) return;
    try {
      await deleteConfigKey(key.id);
      setConfigKeys(prev => prev.filter(k => k.id !== key.id));
      if (selectedKeyId === key.id) setSelectedKeyId(configKeys[0]?.id || null);
      setSnackbar({ open: true, message: 'Config key deleted', severity: 'success' });
    } catch (e) {
      setSnackbar({ open: true, message: e.message || 'Failed to delete key', severity: 'error' });
    }
  };

  const [editForm, setEditForm] = useState(keyFormForEdit);
  useEffect(() => {
    setEditForm(keyFormForEdit);
  }, [selectedKeyId, selectedKey?.target_url, selectedKey?.fail_rate, selectedKey?.min_latency, selectedKey?.max_latency, selectedKey?.method, selectedKey?.error_codes]);

  const handleSaveKey = async () => {
    if (!selectedKeyId || !editForm) return;
    if (editForm.min_latency > editForm.max_latency) {
      setSnackbar({ open: true, message: 'Min latency cannot exceed max latency', severity: 'error' });
      return;
    }
    try {
      const updated = await updateConfigKey(selectedKeyId, {
        name: editForm.name,
        target_url: editForm.target_url.trim() || null,
        fail_rate: Math.max(0, Math.min(100, editForm.fail_rate)),
        min_latency: editForm.min_latency || 0,
        max_latency: editForm.max_latency || 0,
        method: editForm.method || 'ANY',
        error_codes: editForm.error_codes.length ? editForm.error_codes : [],
      });
      setConfigKeys(prev => prev.map(k => k.id === selectedKeyId ? updated : k));
      setSnackbar({ open: true, message: 'Key updated', severity: 'success' });
    } catch (e) {
      setSnackbar({ open: true, message: e.message || 'Failed to update key', severity: 'error' });
    }
  };

  const copyKey = (keyStr) => {
    navigator.clipboard.writeText(keyStr);
    setSnackbar({ open: true, message: 'Copied to clipboard', severity: 'success' });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <KeyIcon /> Configs
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        One key → one target URL. Call <code>{PROXY_API_BASE_URL.replace(/\/$/, '')}/your_api_key</code> (or <code>/your_api_key/path</code>); the proxy forwards to the configured URL with chaos applied.
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        <Paper sx={{ p: 2, minWidth: 320, maxWidth: 400 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Config Keys</Typography>
            <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={() => { setKeyForm({ name: '', target_url: '', fail_rate: 0, min_latency: 0, max_latency: 0, method: 'ANY', error_codes: [] }); setNewKeyReveal(null); setKeyDialog(true); }}>
              Add Key
            </Button>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {configKeys.map((key) => {
              const isSelected = selectedKeyId === key.id;
              const secondary = key.target_url
                ? key.target_url + (key.fail_rate ? ` · ${key.fail_rate}% fail` : '')
                : 'Set target URL';
              return (
                <Box
                  key={key.id}
                  onClick={() => setSelectedKeyId(key.id)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    borderRadius: 1,
                    cursor: 'pointer',
                    bgcolor: isSelected ? 'action.selected' : 'action.hover',
                    border: '1px solid',
                    borderColor: isSelected ? 'primary.main' : 'divider',
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" noWrap>{key.name}</Typography>
                    <Typography variant="body2" color={key.is_active ? 'text.secondary' : 'error'} noWrap sx={{ mt: 0.5, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {secondary}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                    <IconButton size="small" onClick={() => copyKey(`${PROXY_API_BASE_URL.replace(/\/$/, '')}/${key.key}`)} title="Copy URL" aria-label="Copy URL">
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                    <Switch
                      size="small"
                      checked={key.is_active}
                      onChange={() => handleToggleKeyActive(key)}
                      title={key.is_active ? 'Disable' : 'Enable'}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <IconButton size="small" onClick={() => handleDeleteKey(key)} title="Delete" aria-label="Delete">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              );
            })}
          </Box>
          {newKeyReveal && (
            <Alert severity="info" sx={{ mt: 2 }} onClose={() => setNewKeyReveal(null)}>
              New key: <strong>{newKeyReveal}</strong>
              <Button size="small" sx={{ ml: 1 }} onClick={() => copyKey(newKeyReveal)}>Copy</Button>
            </Alert>
          )}
        </Paper>

        <Paper sx={{ flex: 1, minWidth: 400, p: 2 }}>
          {!selectedKey ? (
            <Typography color="text.secondary">Create or select a config key. Each key has one target URL and chaos settings.</Typography>
          ) : (
            <>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {selectedKey.name}
              </Typography>
              {editForm && (
                <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Target URL (base)"
                    fullWidth
                    value={editForm.target_url}
                    onChange={(e) => setEditForm(f => ({ ...f, target_url: e.target.value }))}
                    placeholder="https://api.github.com"
                  />
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <TextField type="number" label="Fail rate %" value={editForm.fail_rate} onChange={(e) => setEditForm(f => ({ ...f, fail_rate: parseInt(e.target.value, 10) || 0 }))} inputProps={{ min: 0, max: 100 }} sx={{ width: 120 }} />
                    <TextField type="number" label="Min latency (ms)" value={editForm.min_latency} onChange={(e) => setEditForm(f => ({ ...f, min_latency: parseInt(e.target.value, 10) || 0 }))} inputProps={{ min: 0 }} sx={{ width: 140 }} />
                    <TextField type="number" label="Max latency (ms)" value={editForm.max_latency} onChange={(e) => setEditForm(f => ({ ...f, max_latency: parseInt(e.target.value, 10) || 0 }))} inputProps={{ min: 0 }} sx={{ width: 140 }} />
                  </Box>
                  <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>Method</InputLabel>
                    <Select value={editForm.method} label="Method" onChange={(e) => setEditForm(f => ({ ...f, method: e.target.value }))}>
                      {METHOD_OPTIONS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Error codes (on simulated failure)</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                      {(editForm.error_codes.length ? editForm.error_codes : []).map(code => (
                        <Chip key={code} label={code} onDelete={() => handleRemoveErrorCode(editForm, setEditForm, code)} size="small" />
                      ))}
                      <TextField size="small" placeholder="e.g. 502" sx={{ width: 80 }} value={errorCodeInput} onChange={(e) => setErrorCodeInput(e.target.value.replace(/\D/g, '').slice(0, 3))} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddErrorCode(editForm, setEditForm))} />
                      <Button size="small" onClick={() => handleAddErrorCode(editForm, setEditForm)}>Add</Button>
                    </Box>
                  </Box>
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Example proxy URL (use this in your app)</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography component="code" sx={{ fontFamily: 'monospace', fontSize: '0.9rem', wordBreak: 'break-all' }}>
                        {PROXY_API_BASE_URL.replace(/\/$/, '')}/{selectedKey.key}
                      </Typography>
                      <IconButton size="small" onClick={() => copyKey(`${PROXY_API_BASE_URL.replace(/\/$/, '')}/${selectedKey.key}`)} title="Copy example URL" aria-label="Copy URL">
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      Path is appended to target URL — e.g. <code>{PROXY_API_BASE_URL.replace(/\/$/, '')}/{selectedKey.key}/users</code> → target_url + /users
                    </Typography>
                  </Box>
                  <Button variant="contained" onClick={handleSaveKey} sx={{ alignSelf: 'flex-start', mt: 2 }}>Save</Button>
                </Box>
              )}
            </>
          )}
        </Paper>
      </Box>

      <Dialog open={keyDialog} onClose={() => setKeyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Config Key</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Name" fullWidth value={keyForm.name} onChange={(e) => setKeyForm(f => ({ ...f, name: e.target.value }))} />
          <TextField margin="dense" label="Target URL (optional)" fullWidth value={keyForm.target_url} onChange={(e) => setKeyForm(f => ({ ...f, target_url: e.target.value }))} placeholder="https://api.github.com" />
          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <TextField type="number" label="Fail rate %" value={keyForm.fail_rate} onChange={(e) => setKeyForm(f => ({ ...f, fail_rate: parseInt(e.target.value, 10) || 0 }))} inputProps={{ min: 0, max: 100 }} />
            <TextField type="number" label="Min latency (ms)" value={keyForm.min_latency} onChange={(e) => setKeyForm(f => ({ ...f, min_latency: parseInt(e.target.value, 10) || 0 }))} inputProps={{ min: 0 }} />
            <TextField type="number" label="Max latency (ms)" value={keyForm.max_latency} onChange={(e) => setKeyForm(f => ({ ...f, max_latency: parseInt(e.target.value, 10) || 0 }))} inputProps={{ min: 0 }} />
          </Box>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Method</InputLabel>
            <Select value={keyForm.method} label="Method" onChange={(e) => setKeyForm(f => ({ ...f, method: e.target.value }))}>
              {METHOD_OPTIONS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </Select>
          </FormControl>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Error codes</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
            {keyForm.error_codes.map(code => (
              <Chip key={code} label={code} onDelete={() => setKeyForm(f => ({ ...f, error_codes: f.error_codes.filter(c => c !== code) }))} size="small" />
            ))}
            <TextField size="small" placeholder="e.g. 502" sx={{ width: 80 }} value={errorCodeInput} onChange={(e) => setErrorCodeInput(e.target.value.replace(/\D/g, '').slice(0, 3))} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddErrorCode(keyForm, setKeyForm))} />
            <Button size="small" onClick={() => handleAddErrorCode(keyForm, setKeyForm)}>Add</Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setKeyDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateKey} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
}

export default Configs;
