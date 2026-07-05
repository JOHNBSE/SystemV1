import { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import MessagesView from '../../components/MessagesView.jsx';

export default function OwnerMessages() {
  const { call } = useAuth();
  const [tenants, setTenants] = useState(null);

  useEffect(() => { call('GET', '/tenants').then(setTenants); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!tenants) return <div className="loading">Loading…</div>;

  const names = Object.fromEntries(tenants.map((t) => [t.user_id, t.user?.name || 'Tenant']));
  const receivers = tenants.filter((t) => t.status === 'active').map((t) => ({ value: t.user_id, label: t.user?.name || 'Tenant' }));

  return <MessagesView receivers={receivers} nameOf={(id) => names[id] || 'User #' + id} />;
}
