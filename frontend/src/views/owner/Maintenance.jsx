import { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import { errMsg } from '../../api.js';
import { Table, useToast, fmtDate } from '../../components/common.jsx';

const STATUSES = ['open', 'in_progress', 'resolved'];

export default function OwnerMaintenance() {
  const { call } = useAuth();
  const toast = useToast();
  const [reqs, setReqs] = useState(null);

  const load = () => call('GET', '/maintenance-requests').then(setReqs);
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!reqs) return <div className="loading">Loading…</div>;

  const setStatus = async (m, status) => {
    try {
      await call('PUT', '/maintenance-requests/' + m.id, { status });
      toast('Status updated.', true);
      load();
    } catch (e) {
      toast(errMsg(e));
      load();
    }
  };

  return (
    <div>
      <h2>Maintenance requests</h2>
      <Table
        heads={['Tenant', 'Unit', 'Issue', 'Reported', 'Status']}
        rows={reqs.map((m) => ({
          key: m.id,
          cells: [
            m.tenant?.user?.name || '#' + m.tenant_id, m.unit?.unit_number || '—',
            m.issue_description, fmtDate(m.created_at),
            <select key="s" value={m.status} onChange={(e) => setStatus(m, e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>,
          ],
        }))}
      />
    </div>
  );
}
