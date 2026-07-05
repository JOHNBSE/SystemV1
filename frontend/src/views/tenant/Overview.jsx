import { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import { StatCard, fmtDate, fmtMoney } from '../../components/common.jsx';

export default function TenantOverview() {
  const { call } = useAuth();
  const [d, setD] = useState(null);

  useEffect(() => { call('GET', '/dashboard').then(setD); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!d) return <div className="loading">Loading…</div>;

  if (d.message) {
    return <div><h2>Overview</h2><div className="note">{d.message}</div></div>;
  }

  return (
    <div>
      <h2>My tenancy</h2>
      <div className="stats">
        <StatCard k="Property" v={d.property?.name || '—'} />
        <StatCard k="Unit" v={d.unit ? `${d.unit.unit_number} (${d.unit.type})` : '—'} />
        <StatCard k="Monthly rent" v={fmtMoney(d.rent_price)} />
        <StatCard k="Lease" v={`${fmtDate(d.lease_start)} → ${fmtDate(d.lease_end)}`} />
        <StatCard k="Total paid" v={fmtMoney(d.total_paid)} />
        <StatCard k="Last payment" v={d.last_payment ? `${fmtMoney(d.last_payment.amount)} on ${fmtDate(d.last_payment.date_paid)}` : '—'} />
        <StatCard k="Open requests" v={d.open_maintenance_requests} />
      </div>
    </div>
  );
}
