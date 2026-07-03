import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { api } from '../api/axios.js';
import StatCard from '../components/StatCard.jsx';

export default function DashboardPage() {
  const { user } = useSelector((state) => state.auth);
  const [profile, setProfile] = useState(null);
  const [income, setIncome] = useState(null);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const load = async () => {
      if (!user?.userId) return;
      const [profileRes, incomeRes, txRes] = await Promise.all([
        api.get(`/api/users/${user.userId}`),
        api.get(`/api/users/${user.userId}/incomes`),
        api.get(`/api/users/${user.userId}/transactions`)
      ]);
      setProfile(profileRes.data.data);
      setIncome(incomeRes.data.data);
      setTransactions(txRes.data.data);
    };
    load();
  }, [user?.userId]);

  return (
    <div className="page-stack dashboard-page">
      <section className="panel-card dashboard-hero">
        <div>
          <p className="eyebrow">Overview</p>
          <h3>{profile?.fullName || user?.fullName || 'Member Dashboard'}</h3>
          <p className="muted">Track income, wallet balance, and team activity from one clean view.</p>
        </div>
        <div className="dashboard-hero-meta">
          <div>
            <span>Wallet</span>
            <strong>₹{income?.incomeWallet ?? profile?.incomeWallet ?? income?.totalIncome ?? profile?.totalIncome ?? 0}</strong>
          </div>
          <div>
            <span>Total Income</span>
            <strong>₹{income?.totalIncome || profile?.totalIncome || 0}</strong>
          </div>
        </div>
      </section>

      <section className="card-grid">
        <StatCard label="Direct Income" value={`₹${income?.directIncome || profile?.directIncome || 0}`} accent="teal" />
        <StatCard label="Pair Income" value={`₹${income?.pairIncome || profile?.pairIncome || 0}`} accent="gold" />
        <StatCard label="Total Income" value={`₹${income?.totalIncome || profile?.totalIncome || 0}`} accent="rose" />
        <StatCard label="Income Wallet" value={`₹${income?.incomeWallet ?? profile?.incomeWallet ?? income?.totalIncome ?? profile?.totalIncome ?? 0}`} accent="indigo" />
        <StatCard label="Team Count" value={profile?.totalTeamCount || 0} accent="indigo" />
      </section>

      <section className="two-col">
        <div className="panel-card summary-card account-summary-card">
          <div className="summary-card-head">
            <div>
              <p className="eyebrow">Profile</p>
              <h3>Account Summary</h3>
            </div>
            <span className="summary-pill summary-pill-indigo">Live</span>
          </div>
          <div className="data-list">
            <span>User ID</span><strong>{profile?.userId}</strong>
            <span>Name</span><strong>{profile?.fullName}</strong>
            <span>Sponsor ID</span><strong>{profile?.sponsorId}</strong>
            <span>Parent ID</span><strong>{profile?.parentId}</strong>
            <span>Registration Date</span><strong>{profile?.registrationDate ? new Date(profile.registrationDate).toLocaleString() : '-'}</strong>
            <span>Status</span><strong>{profile?.activeStatus ? 'Active' : 'Inactive'}</strong>
            <span>Income Wallet</span><strong>₹{profile?.incomeWallet ?? profile?.totalIncome ?? 0}</strong>
          </div>
        </div>
        <div className="panel-card summary-card fund-summary-card">
          <div className="summary-card-head">
            <div>
              <p className="eyebrow">Balances</p>
              <h3>Team Summary</h3>
            </div>
            <span className="summary-pill summary-pill-teal">Snapshot</span>
          </div>
          <div className="data-list">
            {/* <span>Cyber Fund Balance</span><strong>₹{profile?.cyberFundBalance || 0}</strong> */}
            {/* <span>Bonus Fund Balance</span><strong>₹{profile?.bonusFundBalance || 0}</strong> */}
            <span>Left Team Count</span><strong>{profile?.leftTeamCount || 0}</strong>
            <span>Right Team Count</span><strong>{profile?.rightTeamCount || 0}</strong>
            <span>Left Active Team Count</span><strong>{profile?.leftActiveTeamCount || 0}</strong>
            <span>Right Active Team Count</span><strong>{profile?.rightActiveTeamCount || 0}</strong>
          </div>
        </div>
      </section>

      <section className="panel-card">
        <h3>Recent Transactions</h3>
        <div className="table-wrap dashboard-transactions-desktop">
          <table>
            <thead><tr><th>Date</th><th>Description</th><th>Credit</th><th>Debit</th></tr></thead>
            <tbody>
              {transactions.map((item) => (
                <tr key={item._id}><td>{new Date(item.date).toLocaleString()}</td><td>{item.description}</td><td>₹{item.credit}</td><td>₹{item.debit}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="dashboard-transactions-mobile">
          {transactions.map((item) => (
            <article key={item._id} className="dashboard-transaction-card">
              <div className="dashboard-transaction-card-head">
                <div>
                  <span className="eyebrow">Transaction</span>
                  <strong>{item.description}</strong>
                  <p>{new Date(item.date).toLocaleString()}</p>
                </div>
                <div className="dashboard-transaction-badges">
                  <span className="transaction-credit">₹{item.credit}</span>
                  <span className="transaction-debit">₹{item.debit}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}