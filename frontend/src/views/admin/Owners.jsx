import { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import { errMsg } from '../../api.js';
import { Table, Badge, useToast } from '../../components/common.jsx';

export default function AdminOwners() {
  const { call } = useAuth();
  const toast = useToast();
  const [owners, setOwners] = useState(null);

  const load = () => call('GET', '/admin/owners').then(setOwners);
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!owners) return <div className="loading">Loading…</div>;

  const toggle = async (o) => {
    const action = o.status === 'active' ? 'suspend' : 'activate';
    if (!confirm(`${action[0].toUpperCase() + action.slice(1)} ${o.name}?`)) return;
    try {
      await call('POST', `/admin/owners/${o.id}/${action}`);
      toast('Owner ' + action + 'd.', true);
      load();
    } catch (e) {
      toast(errMsg(e));
    }
  };

  return (
    <div>
      <h2>Property owners</h2>
      <Table
        heads={['Name', 'Email', 'Company', 'Properties', 'Tenants', 'Status', '']}
        rows={owners.map((o) => ({
          key: o.id,
          cells: [
            o.name, o.email, o.owner_profile?.company_name || '—',
            String(o.properties_count), String(o.tenants_count), <Badge key="b" status={o.status} />,
            <button key="btn" className={'btn-sm' + (o.status === 'active' ? ' danger' : '')} onClick={() => toggle(o)}>
              {o.status === 'active' ? 'Suspend' : 'Activate'}
            </button>,
          ],
        }))}
      />
    </div>
  );
}
