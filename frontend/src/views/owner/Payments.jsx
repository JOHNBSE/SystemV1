import { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import { errMsg } from '../../api.js';
import { Table, Badge, useToast, fmtDate, fmtMoney } from '../../components/common.jsx';
import DataForm from '../../components/DataForm.jsx';

const METHODS = ['cash', 'mpesa', 'bank', 'card'].map((m) => ({ value: m, label: m }));

export default function OwnerPayments() {
  const { call } = useAuth();
  const toast = useToast();
  const [payments, setPayments] = useState(null);
  const [tenants, setTenants] = useState(null);

  const load = () => Promise.all([call('GET', '/payments'), call('GET', '/tenants')]).then(([p, t]) => { setPayments(p); setTenants(t); });
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!payments || !tenants) return <div className="loading">Loading…</div>;

  const active = tenants.filter((t) => t.status === 'active');

  const submit = async (values) => {
    await call('POST', '/payments', values);
    toast('Payment recorded.', true);
    load();
  };

  const setStatus = async (p, status) => {
    try {
      await call('PUT', '/payments/' + p.id, { status });
      toast('Payment ' + (status === 'completed' ? 'approved' : 'rejected') + '.', true);
      load();
    } catch (e) {
      toast(errMsg(e));
    }
  };

  const remove = async (p) => {
    if (!confirm('Delete this payment record?')) return;
    try {
      await call('DELETE', '/payments/' + p.id);
      toast('Payment deleted.', true);
      load();
    } catch (e) {
      toast(errMsg(e));
    }
  };

  return (
    <div>
      <h2>Payments</h2>
      {active.length > 0 && (
        <DataForm
          fields={[
            { name: 'tenant_id', label: 'Tenant', type: 'select', options: active.map((t) => ({ value: t.id, label: `${t.user?.name} (${t.unit?.unit_number ?? '—'})` })) },
            { name: 'amount', label: 'Amount', type: 'number', required: true, min: 0.01 },
            { name: 'date_paid', label: 'Date paid', type: 'date', required: true },
            { name: 'method', label: 'Method', type: 'select', options: METHODS },
          ]}
          initial={{ date_paid: new Date().toISOString().slice(0, 10) }}
          onSubmit={submit}
          submitLabel="Record payment"
        />
      )}
      <Table
        heads={['Tenant', 'Unit', 'Amount', 'Date', 'Method', 'Status', '']}
        rows={payments.map((p) => ({
          key: p.id,
          cells: [
            p.tenant?.user?.name || '#' + p.tenant_id, p.unit?.unit_number || '—',
            fmtMoney(p.amount), fmtDate(p.date_paid), p.method, <Badge key="b" status={p.status} />,
            <div className="actions" key="a">
              {p.status === 'pending' && <button className="btn-sm" onClick={() => setStatus(p, 'completed')}>Approve</button>}
              {p.status === 'pending' && <button className="btn-sm danger" onClick={() => setStatus(p, 'failed')}>Reject</button>}
              <button className="btn-sm danger" onClick={() => remove(p)}>Delete</button>
            </div>,
          ],
        }))}
      />
    </div>
  );
}
