import { useEffect, useState } from 'react';
import { api } from '../api/axios.js';

export default function FundReportsPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get('/api/reports/cyber-fund').then(({ data }) => setItems(data.data));
  }, []);

  return (
    <div className="page-stack fund-reports-page">
      <section className="panel-card fund-report-panel">
        <h3>Cyber Fund Report</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>User ID</th><th>Fund Type</th><th>Amount</th><th>Date</th></tr></thead>
            <tbody>
              {items.map((item) => <tr key={item._id}><td>{item.userId}</td><td>{item.fundType}</td><td>₹{item.amount}</td><td>{new Date(item.date).toLocaleString()}</td></tr>)}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}