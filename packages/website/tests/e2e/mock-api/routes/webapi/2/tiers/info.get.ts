export default defineEventHandler(() => [
  {
    name: 'Basic',
    monthly_plan: { price: '25.00', id: 3 },
    yearly_plan: { price: '250.00', id: 4 },
    limits: {
      eth_staked_limit: 128,
      limit_of_devices: 2,
      pnl_events_limit: 30000,
      max_backup_size_mb: 150,
      history_events_limit: 30000,
      reports_lookup_limit: 100,
    },
    description: [
      { label: 'Historical events limit', value: '30K events' },
      { label: 'Encrypted data backups', value: 'Store up to 150MB' },
    ],
  },
  {
    name: 'Advanced',
    monthly_plan: { price: '45.00', id: 1 },
    yearly_plan: { price: '450.00', id: 2 },
    limits: {
      eth_staked_limit: 384,
      limit_of_devices: 4,
      pnl_events_limit: 100000,
      max_backup_size_mb: 600,
      history_events_limit: 100000,
      reports_lookup_limit: 300,
    },
    description: [
      { label: 'Historical events limit', value: '100K events' },
      { label: 'Encrypted data backups', value: 'Store up to 600MB' },
    ],
  },
]);
