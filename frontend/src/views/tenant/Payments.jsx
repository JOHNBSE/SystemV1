import { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import { Table, Badge, useToast, fmtDate, fmtMoney } from '../../components/common.jsx';
import DataForm from '../../components/DataForm.jsx';

const METHODS = ['cash', 'mpesa', 'bank', 'card'].map((m) => ({ value: m, label: m }));

export default function TenantPayments() {
  const { call } = useAuth();
  const toast = useToast();
  const [payments, setPayments] = useState(null);

  const load = () => call('GET', '/payments').then(setPayments);
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!payments) return <div className="loading">Loading…</div>;

  const submit = async (values) => {
    await call('POST', '/payments', values);
    toast('Payment submitted for confirmation.', true);
    load();
  };

  return (
    <div>
      <h2>My payments</h2>
      <div className="note">Submitted payments are marked pending until your landlord confirms them.</div>
      <DataForm
        fields={[
          { name: 'amount', label: 'Amount', type: 'number', required: true, min: 0.01 },
          { name: 'method', label: 'Method', type: 'select', options: METHODS },
        ]}
        onSubmit={submit}
        submitLabel="Submit payment"
      />
      <Table
        heads={['Amount', 'Date', 'Method', 'Status']}
        rows={payments.map((p) => ({
          key: p.id,
          cells: [fmtMoney(p.amount), fmtDate(p.date_paid), p.method, <Badge key="b" status={p.status} />],
        }))}
      />
    </div>
  );
}
