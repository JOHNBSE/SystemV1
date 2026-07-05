import { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import { StatCard, fmtMoney } from '../../components/common.jsx';

export default function OwnerOverview() {
  const { call } = useAuth();
  const [d, setD] = useState(null);

  useEffect(() => { call('GET', '/dashboard').then(setD); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!d) return <div className="loading">Loading…</div>;

  return (
    <div>
      <h2>Overview</h2>
      <div className="stats">
        <StatCard k="Properties" v={d.properties} />
        <StatCard k="Units" v={d.units} />
        <StatCard k="Occupied" v={d.occupied_units} />
        <StatCard k="Vacant" v={d.vacant_units} />
        <StatCard k="Occupancy" v={d.occupancy_rate + '%'} />
        <StatCard k="Active tenants" v={d.tenants} />
        <StatCard k="Income this month" v={fmtMoney(d.income_this_month)} />
        <StatCard k="Pending maintenance" v={d.pending_maintenance} />
      </div>
    </div>
  );
}
