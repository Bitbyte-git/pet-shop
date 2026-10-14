import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function TopSellingProductsChart({ data }) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        No sales data available
      </div>
    );
  }

  const chartData = data.map(item => ({
    name: item.name && item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name || 'Unknown',
    fullName: item.name || 'Unknown',
    revenue: item.revenue || 0,
    quantity: item.quantity || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" tickFormatter={(value) => `₹${value.toLocaleString()}`} />
        <YAxis type="category" dataKey="name" width={100} />
        <Tooltip
          formatter={(value, name) => [
            name === 'revenue' ? `₹${value.toLocaleString()}` : value,
            name === 'revenue' ? 'Revenue' : 'Quantity'
          ]}
          labelFormatter={(label) => chartData.find(d => d.name === label)?.fullName || label}
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}
        />
        <Bar dataKey="revenue" fill="#10b981" />
      </BarChart>
    </ResponsiveContainer>
  );
}
