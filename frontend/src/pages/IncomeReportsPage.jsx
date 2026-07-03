import { Fragment, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { api } from '../api/axios.js';

const formatMoney = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
}).format(Number(value || 0));

export default function IncomeReportsPage() {
  const { user } = useSelector((state) => state.auth);
  const [items, setItems] = useState([]);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [mobileExpandedUserId, setMobileExpandedUserId] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      if (user?.role === 'admin') {
        const { data } = await api.get(`/api/reports/income-summary${search ? `?q=${encodeURIComponent(search)}` : ''}`);
        setItems(data.data);
        if (expandedUserId && !data.data.some((item) => item.userId === expandedUserId)) {
          setExpandedUserId(null);
        }
        if (mobileExpandedUserId && !data.data.some((item) => item.userId === mobileExpandedUserId)) {
          setMobileExpandedUserId(null);
        }
        return;
      }

      const [incomeRes, profileRes] = await Promise.all([
        api.get(`/api/users/${user?.userId}/incomes`),
        api.get(`/api/users/${user?.userId}`)
      ]);
      const incomeData = incomeRes.data.data;
      const profileData = profileRes.data.data;
      const totalLeft = Number(profileData?.leftTeamCount || 0);
      const totalRight = Number(profileData?.rightTeamCount || 0);
      setItems([
        {
          userId: user?.userId,
          fullName: profileData?.fullName || user?.fullName,
          totalIncome: incomeData.totalIncome,
          incomeWallet: incomeData.incomeWallet,
          totalLeft,
          totalRight,
          totalPair: Math.min(totalLeft, totalRight),
          allTotal: incomeData.totalIncome,
          walletTotal: incomeData.incomeWallet,
          directTotal: incomeData.directIncome,
          pairTotal: incomeData.pairIncome,
          incomeRows: incomeData.items.filter((row) => row.incomeType === 'direct' || row.incomeType === 'pair')
        }
      ]);
      setExpandedUserId(user?.userId || null);
      setMobileExpandedUserId(user?.userId || null);
    };

    load();
  }, [search, user?.role, user?.userId, user?.fullName]);

  return (
    <div className="page-stack income-reports-page">
      <section className="panel-card">
        <div className="report-header">
          <div>
            <h3>Income Report</h3>
            <p className="muted">
              {user?.role === 'admin'
                ? 'Click a User ID to expand all income rows and totals.'
                : 'This page shows only your own income reports.'}
            </p>
          </div>
          {user?.role === 'admin' && (
            <input
              className="report-search"
              placeholder="Search by User ID or name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}
        </div>
        <div className="table-wrap income-report-desktop">
          <table>
            <thead><tr><th>User ID</th><th>Name</th><th>Activation</th><th>Total Income</th><th>Income Wallet</th><th>Left</th><th>Right</th><th>Pair</th><th>All Total</th></tr></thead>
            <tbody>
              {items.map((item) => (
                <Fragment key={item.userId}>
                  <tr key={item.userId} className="expandable-row" onClick={() => setExpandedUserId(expandedUserId === item.userId ? null : item.userId)}>
                    <td><button className="link-button" type="button">{item.userId}</button></td>
                    <td>{item.fullName}</td>
                    <td><span className={`status-pill ${item.activationLabel === 'Order Active' ? 'status-pill-order' : item.activationLabel === 'Admin Active' ? 'status-pill-admin' : 'status-pill-inactive'}`}>{item.activationLabel || (item.activeStatus ? 'Admin Active' : 'Inactive')}</span></td>
                    <td>{formatMoney(item.totalIncome || 0)}</td>
                    <td>{formatMoney(item.incomeWallet ?? item.walletTotal ?? 0)}</td>
                    <td>{item.totalLeft}</td>
                    <td>{item.totalRight}</td>
                    <td>{item.totalPair}</td>
                    <td>{formatMoney(item.allTotal)}</td>
                  </tr>
                  {expandedUserId === item.userId && (
                    <tr className="expanded-detail-row">
                      <td colSpan="9">
                        <div className="expanded-card">
                          <div className="expanded-summary">
                            <span><strong>Activation:</strong> {item.activationLabel || (item.activeStatus ? 'Admin Active' : 'Inactive')}</span>
                            <span><strong>Direct:</strong> {formatMoney(item.directTotal)}</span>
                            <span><strong>Pair:</strong> {formatMoney(item.pairTotal)}</span>
                            <span><strong>Income Wallet:</strong> {formatMoney(item.incomeWallet ?? item.walletTotal ?? item.allTotal)}</span>
                            <span><strong>Total Income:</strong> {formatMoney(item.allTotal)}</span>
                          </div>
                          <div className="table-wrap nested-table">
                            <table>
                              <thead>
                                <tr>
                                  <th>Type</th>
                                  <th>Amount</th>
                                  <th>Source User</th>
                                  <th>Description</th>
                                  <th>Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {item.incomeRows.map((row) => (
                                  <tr key={row._id}>
                                    <td>{row.incomeType}</td>
                                    <td>{formatMoney(row.amount)}</td>
                                    <td>{row.sourceUserId}</td>
                                    <td>
                                      {row.incomeType === 'direct'
                                        ? `Direct referral by ${row.sourceUserId}`
                                        : `Pair formed by ${row.pairLeftUserId || '-'} + ${row.pairRightUserId || '-'}`}
                                    </td>
                                    <td>{new Date(row.date).toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="income-report-mobile">
          {items.map((item) => {
            const isOpen = mobileExpandedUserId === item.userId;

            return (
              <article key={item.userId} className="income-report-card">
                <button
                  className="income-report-card-header"
                  type="button"
                  onClick={() => setMobileExpandedUserId(isOpen ? null : item.userId)}
                >
                  <div>
                    <span className="eyebrow">User Report</span>
                    <strong>{item.fullName}</strong>
                    <p>{item.userId}</p>
                  </div>
                  <div className="income-report-card-total">
                    <span>Total</span>
                    <strong>{formatMoney(item.allTotal)}</strong>
                  </div>
                </button>

                <div className="income-report-meta-grid">
                  <div><span>Activation</span><strong>{item.activationLabel || (item.activeStatus ? 'Admin Active' : 'Inactive')}</strong></div>
                  <div><span>Total Income</span><strong>{formatMoney(item.totalIncome || 0)}</strong></div>
                  <div><span>Income Wallet</span><strong>{formatMoney(item.incomeWallet ?? item.walletTotal ?? 0)}</strong></div>
                  <div><span>Left</span><strong>{item.totalLeft}</strong></div>
                  <div><span>Right</span><strong>{item.totalRight}</strong></div>
                </div>

                {isOpen && (
                  <div className="income-report-expanded-mobile">
                    <div className="expanded-summary">
                      <span><strong>Direct:</strong> {formatMoney(item.directTotal)}</span>
                      <span><strong>Pair:</strong> {formatMoney(item.pairTotal)}</span>
                      <span><strong>Income Wallet:</strong> {formatMoney(item.incomeWallet ?? item.walletTotal ?? item.allTotal)}</span>
                    </div>
                    <div className="table-wrap nested-table income-report-nested-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Source</th>
                          </tr>
                        </thead>
                        <tbody>
                          {item.incomeRows.map((row) => (
                            <tr key={row._id}>
                              <td>{row.incomeType}</td>
                              <td>{formatMoney(row.amount)}</td>
                              <td>{row.sourceUserId || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}