import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function SalesTrendChart({ data, showClinicOnly = false }) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        No sales data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="dayName" />
        <YAxis tickFormatter={(value) => `₹${value.toLocaleString()}`} />
        <Tooltip
          formatter={(value) => [`₹${value.toLocaleString()}`, '']}
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}
        />
        <Legend />
        {!showClinicOnly && <Bar dataKey="productSales" name="Product Sales" fill="#3b82f6" />}
        <Bar dataKey="clinicSales" name="Clinic Sales" fill="#f59e0b" />
      </BarChart>
    </ResponsiveContainer>
  );
}
