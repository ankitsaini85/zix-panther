import { useEffect, useState } from 'react';
import { api } from '../api/axios.js';
import StatCard from '../components/StatCard.jsx';

const formatMoney = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
}).format(Number(value || 0));

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    api.get('/api/admin/dashboard').then(({ data }) => setSummary(data.data));
  }, []);

  const cards = [
    ['Total Users', summary?.totalUsers],
    ['Active Users', summary?.activeUsers],
    ['Inactive Users', summary?.inactiveUsers],
    ['Total Registration Collection', formatMoney(summary?.totalRegistrationCollection || 0)],
    ['Total Direct Income', formatMoney(summary?.totalDirectIncome || 0)],
    ['Total Pair Income', formatMoney(summary?.totalPairIncome || 0)],
    ['Income Wallet', formatMoney(summary?.totalIncomeWallet || 0)],
    ['Total Cyber Fund', formatMoney(summary?.totalCyberFund || 0)],
    ['Total Bonus Fund', formatMoney(summary?.totalBonusFund || 0)],
    ['Pending Withdrawals', summary?.pendingWithdrawals || 0]
  ];

  return (
    <div className="page-stack">
      <section className="card-grid large-grid">
        {cards.map(([label, value]) => <StatCard key={label} label={label} value={value ?? 0} />)}
      </section>
      <section className="panel-card">
        <h3>Operations Snapshot</h3>
        <p className="muted">Use the user management and reports sections to search, filter, and audit the network.</p>
      </section>
    </div>
  );
}