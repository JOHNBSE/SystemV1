import { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import { StatCard, fmtMoney } from '../../components/common.jsx';

export default function AdminOverview() {
  const { call } = useAuth();
  const [d, setD] = useState(null);

  useEffect(() => { call('GET', '/admin/analytics').then(setD); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!d) return <div className="loading">Loading…</div>;

  return (
    <div>
      <h2>Platform analytics</h2>
      <div className="stats">
        <StatCard k="Owners" v={d.owners} />
        <StatCard k="Tenants" v={d.tenants} />
        <StatCard k="Properties" v={d.properties} />
        <StatCard k="Units" v={d.units} />
        <StatCard k="Occupied units" v={d.occupied_units} />
        <StatCard k="Open maintenance" v={d.open_maintenance_requests} />
        <StatCard k="Total revenue" v={fmtMoney(d.revenue_total)} />
        <StatCard k="Tenant profiles" v={d.tenant_profiles} />
      </div>
    </div>
  );
}
