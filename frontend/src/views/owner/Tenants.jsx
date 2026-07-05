import { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import { errMsg } from '../../api.js';
import { Table, Badge, useToast, fmtDate } from '../../components/common.jsx';
import DataForm from '../../components/DataForm.jsx';

export default function OwnerTenants() {
  const { call } = useAuth();
  const toast = useToast();
  const [tenants, setTenants] = useState(null);
  const [units, setUnits] = useState(null);
  const [editing, setEditing] = useState(null);
  const [tempPassNote, setTempPassNote] = useState(null);

  const load = () => Promise.all([call('GET', '/tenants'), call('GET', '/units')]).then(([t, u]) => { setTenants(t); setUnits(u); });
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!tenants || !units) return <div className="loading">Loading…</div>;

  const vacant = units.filter((u) => u.status === 'vacant');

  const fields = editing
    ? [
        { name: 'lease_start', label: 'Lease start', type: 'date' },
        { name: 'lease_end', label: 'Lease end', type: 'date' },
      ]
    : [
        { name: 'name', label: 'Full name', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'unit_id', label: 'Assign vacant unit', type: 'select', options: vacant.map((u) => ({ value: u.id, label: `${u.unit_number} (${u.type})` })) },
        { name: 'lease_start', label: 'Lease start', type: 'date' },
        { name: 'lease_end', label: 'Lease end', type: 'date' },
      ];

  const submit = async (values) => {
    if (editing) {
      await call('PUT', '/tenants/' + editing.id, { lease_start: values.lease_start || null, lease_end: values.lease_end || null });
      toast('Tenant updated.', true);
      setEditing(null);
      load();
      return;
    }
    if (!values.unit_id) throw new Error('No vacant unit available to assign.');
    const res = await call('POST', '/tenants', values);
    setTempPassNote(`Tenant account created. Temporary password for ${res.tenant.user.email}: ${res.temporary_password} — share it securely; it is shown only once.`);
    load();
  };

  const endLease = async (t) => {
    if (!confirm(`End ${t.user?.name}'s lease?`)) return;
    try {
      await call('PUT', '/tenants/' + t.id, { status: 'ended' });
      toast('Lease ended.', true);
      load();
    } catch (e) {
      toast(errMsg(e));
    }
  };

  const remove = async (t) => {
    if (!confirm(`Remove ${t.user?.name} and their account?`)) return;
    try {
      await call('DELETE', '/tenants/' + t.id);
      toast('Tenant removed.', true);
      load();
    } catch (e) {
      toast(errMsg(e));
    }
  };

  return (
    <div>
      <h2>Tenants</h2>
      {tempPassNote && <div className="note">{tempPassNote}</div>}
      {!vacant.length && !tenants.length && <div className="note">Add a vacant unit first, then assign a tenant to it.</div>}
      <DataForm
        key={editing?.id ?? 'new'}
        fields={fields}
        initial={editing ? { lease_start: fmtDate(editing.lease_start) !== '—' ? fmtDate(editing.lease_start) : '', lease_end: fmtDate(editing.lease_end) !== '—' ? fmtDate(editing.lease_end) : '' } : {}}
        onSubmit={submit}
        submitLabel={editing ? 'Update lease' : 'Save tenant'}
      />
      <Table
        heads={['Tenant', 'Email', 'Unit', 'Lease', 'Status', '']}
        rows={tenants.map((t) => ({
          key: t.id,
          cells: [
            t.user?.name || '—', t.user?.email || '—',
            t.unit ? `${t.unit.unit_number} — ${t.unit.property?.name ?? ''}` : '—',
            `${fmtDate(t.lease_start)} → ${fmtDate(t.lease_end)}`,
            <Badge key="b" status={t.status} />,
            <div className="actions" key="a">
              <button className="btn-sm" onClick={() => setEditing(t)}>Edit lease</button>
              {t.status === 'active' && <button className="btn-sm" onClick={() => endLease(t)}>End lease</button>}
              <button className="btn-sm danger" onClick={() => remove(t)}>Remove</button>
            </div>,
          ],
        }))}
      />
    </div>
  );
}
