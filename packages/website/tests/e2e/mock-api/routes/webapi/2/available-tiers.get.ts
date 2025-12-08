export default defineEventHandler(() => ({
  settings: {
    is_authenticated: false,
    country: null,
  },
  tiers: [
    {
      tier_name: 'Free',
      monthly_plan: null,
      yearly_plan: null,
    },
    {
      tier_name: 'Basic',
      monthly_plan: { plan_id: 3, price: '25.00' },
      yearly_plan: { plan_id: 4, price: '250.00' },
    },
    {
      tier_name: 'Advanced',
      monthly_plan: { plan_id: 1, price: '45.00' },
      yearly_plan: { plan_id: 2, price: '450.00' },
    },
  ],
}));
