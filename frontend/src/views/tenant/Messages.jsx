import { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import MessagesView from '../../components/MessagesView.jsx';

export default function TenantMessages() {
  const { call } = useAuth();
  const [ownerId, setOwnerId] = useState(undefined);

  useEffect(() => {
    call('GET', '/dashboard').then((d) => setOwnerId(d.property?.owner_id ?? null));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (ownerId === undefined) return <div className="loading">Loading…</div>;

  const receivers = ownerId ? [{ value: ownerId, label: 'My landlord' }] : [];
  return <MessagesView receivers={receivers} nameOf={() => 'Landlord'} />;
}
