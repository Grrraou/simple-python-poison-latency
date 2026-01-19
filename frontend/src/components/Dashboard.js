import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
} from '@mui/material';
import {
  Api as ApiIcon,
  Key as KeyIcon,
  Storage as StorageIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { fetchCollections, fetchApiKeys, fetchEndpoints } from '../services/api';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00C49F', '#FFBB28', '#FF8042'];

function StatCard({ title, value, subtitle, icon: Icon, color = 'primary' }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              bgcolor: `${color}.light`,
              borderRadius: 2,
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon sx={{ fontSize: 32, color: `${color}.main` }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [allEndpoints, setAllEndpoints] = useState([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    totalCollections: 0,
    totalEndpoints: 0,
    totalApiKeys: 0,
    activeApiKeys: 0,
    activeCollections: 0,
    activeEndpoints: 0,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [collectionsData, apiKeysData] = await Promise.all([
        fetchCollections(),
        fetchApiKeys(),
      ]);

      setCollections(collectionsData);
      setApiKeys(apiKeysData);

      // Load all endpoints for all collections
      const endpointsPromises = collectionsData.map(c => 
        fetchEndpoints(c.id).then(endpoints => 
          endpoints.map(e => ({ ...e, collectionName: c.name }))
        )
      );
      const endpointsArrays = await Promise.all(endpointsPromises);
      const allEndpointsData = endpointsArrays.flat();
      setAllEndpoints(allEndpointsData);

      // Calculate stats
      const totalRequests = 
        collectionsData.reduce((sum, c) => sum + (c.request_count || 0), 0);
      
      setStats({
        totalRequests,
        totalCollections: collectionsData.length,
        totalEndpoints: allEndpointsData.length,
        totalApiKeys: apiKeysData.length,
        activeApiKeys: apiKeysData.filter(k => k.is_active).length,
        activeCollections: collectionsData.filter(c => c.is_active !== false).length,
        activeEndpoints: allEndpointsData.filter(e => e.is_active !== false).length,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Prepare chart data
  const collectionRequestsData = collections
    .map(c => ({
      name: c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name,
      requests: c.request_count || 0,
    }))
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 8);

  const endpointRequestsData = allEndpoints
    .map(e => ({
      name: e.name.length > 20 ? e.name.substring(0, 20) + '...' : e.name,
      requests: e.request_count || 0,
      collection: e.collectionName,
    }))
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 10);

  const apiKeyUsageData = apiKeys
    .filter(k => k.request_count > 0)
    .map(k => ({
      name: k.name.length > 15 ? k.name.substring(0, 15) + '...' : k.name,
      requests: k.request_count || 0,
    }))
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 8);

  // Latency distribution
  const latencyDistribution = allEndpoints.reduce((acc, e) => {
    const avgLatency = (e.min_latency + e.max_latency) / 2;
    let bucket;
    if (avgLatency < 100) bucket = '< 100ms';
    else if (avgLatency < 500) bucket = '100-500ms';
    else if (avgLatency < 1000) bucket = '500-1000ms';
    else if (avgLatency < 2000) bucket = '1-2s';
    else bucket = '> 2s';
    
    acc[bucket] = (acc[bucket] || 0) + 1;
    return acc;
  }, {});

  const latencyData = ['< 100ms', '100-500ms', '500-1000ms', '1-2s', '> 2s']
    .map(bucket => ({
      name: bucket,
      count: latencyDistribution[bucket] || 0,
    }))
    .filter(d => d.count > 0);

  // Fail rate distribution
  const failRateDistribution = allEndpoints.reduce((acc, e) => {
    let bucket;
    if (e.fail_rate === 0) bucket = '0%';
    else if (e.fail_rate <= 10) bucket = '1-10%';
    else if (e.fail_rate <= 25) bucket = '11-25%';
    else if (e.fail_rate <= 50) bucket = '26-50%';
    else bucket = '> 50%';
    
    acc[bucket] = (acc[bucket] || 0) + 1;
    return acc;
  }, {});

  const failRateData = ['0%', '1-10%', '11-25%', '26-50%', '> 50%']
    .map(bucket => ({
      name: bucket,
      count: failRateDistribution[bucket] || 0,
    }))
    .filter(d => d.count > 0);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Requests"
            value={formatNumber(stats.totalRequests)}
            subtitle="All time"
            icon={TrendingUpIcon}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Collections"
            value={stats.totalCollections}
            subtitle={`${stats.activeCollections} active`}
            icon={StorageIcon}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Endpoints"
            value={stats.totalEndpoints}
            subtitle={`${stats.activeEndpoints} active`}
            icon={ApiIcon}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="API Keys"
            value={stats.totalApiKeys}
            subtitle={`${stats.activeApiKeys} active`}
            icon={KeyIcon}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Charts Row 1 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Requests by Collection */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Requests by Collection
            </Typography>
            {collectionRequestsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={collectionRequestsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => [formatNumber(value), 'Requests']} />
                  <Bar dataKey="requests" fill="#8884d8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 320 }}>
                <Typography color="text.secondary">No request data yet</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Requests by API Key */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Requests by API Key
            </Typography>
            {apiKeyUsageData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={apiKeyUsageData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => [formatNumber(value), 'Requests']} />
                  <Bar dataKey="requests" fill="#82ca9d" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 320 }}>
                <Typography color="text.secondary">No API key usage yet</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Charts Row 2 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Latency Distribution */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, height: 300 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SpeedIcon fontSize="small" /> Latency Config
            </Typography>
            {latencyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={latencyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="count"
                    label={({ name, count }) => `${name}: ${count}`}
                    labelLine={false}
                  >
                    {latencyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 220 }}>
                <Typography color="text.secondary">No endpoints</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Fail Rate Distribution */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, height: 300 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ErrorIcon fontSize="small" /> Fail Rate Config
            </Typography>
            {failRateData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={failRateData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="count"
                    label={({ name, count }) => `${name}: ${count}`}
                    labelLine={false}
                  >
                    {failRateData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 220 }}>
                <Typography color="text.secondary">No endpoints</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Status Overview */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 300 }}>
            <Typography variant="h6" gutterBottom>
              Status Overview
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Collections
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats.totalCollections > 0 ? (stats.activeCollections / stats.totalCollections) * 100 : 0}
                    sx={{ flex: 1, height: 8, borderRadius: 4 }}
                    color="success"
                  />
                  <Typography variant="body2">
                    {stats.activeCollections}/{stats.totalCollections}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Endpoints
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats.totalEndpoints > 0 ? (stats.activeEndpoints / stats.totalEndpoints) * 100 : 0}
                    sx={{ flex: 1, height: 8, borderRadius: 4 }}
                    color="info"
                  />
                  <Typography variant="body2">
                    {stats.activeEndpoints}/{stats.totalEndpoints}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  API Keys
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats.totalApiKeys > 0 ? (stats.activeApiKeys / stats.totalApiKeys) * 100 : 0}
                    sx={{ flex: 1, height: 8, borderRadius: 4 }}
                    color="warning"
                  />
                  <Typography variant="body2">
                    {stats.activeApiKeys}/{stats.totalApiKeys}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Requests
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {formatNumber(stats.totalRequests)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Top Endpoints Table */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Top Endpoints by Usage
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Endpoint</TableCell>
                <TableCell>Collection</TableCell>
                <TableCell align="right">Requests</TableCell>
                <TableCell align="right">Latency</TableCell>
                <TableCell align="right">Fail Rate</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {endpointRequestsData.length > 0 ? (
                endpointRequestsData.map((endpoint, index) => {
                  const fullEndpoint = allEndpoints.find(e => e.name === endpoint.name || e.name.startsWith(endpoint.name.replace('...', '')));
                  return (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {endpoint.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={endpoint.collection} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {formatNumber(endpoint.requests)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {fullEndpoint ? `${fullEndpoint.min_latency}-${fullEndpoint.max_latency}ms` : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {fullEndpoint ? `${fullEndpoint.fail_rate}%` : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {fullEndpoint && fullEndpoint.is_active !== false ? (
                          <Chip label="Active" size="small" color="success" />
                        ) : (
                          <Chip label="Inactive" size="small" />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary" sx={{ py: 3 }}>
                      No endpoint data yet. Start using the proxy to see statistics.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

export default Dashboard;
