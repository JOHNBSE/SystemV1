import { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import { Table, Badge, useToast, fmtDate } from '../../components/common.jsx';
import DataForm from '../../components/DataForm.jsx';

export default function TenantMaintenance() {
  const { call } = useAuth();
  const toast = useToast();
  const [reqs, setReqs] = useState(null);

  const load = () => call('GET', '/maintenance-requests').then(setReqs);
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!reqs) return <div className="loading">Loading…</div>;

  const submit = async (values) => {
    await call('POST', '/maintenance-requests', values);
    toast('Request submitted.', true);
    load();
  };

  return (
    <div>
      <h2>Maintenance requests</h2>
      <DataForm
        stacked
        fields={[{ name: 'issue_description', label: 'Describe the issue', type: 'textarea', required: true }]}
        onSubmit={submit}
        submitLabel="Report issue"
      />
      <Table
        heads={['Issue', 'Reported', 'Status']}
        rows={reqs.map((m) => ({
          key: m.id,
          cells: [m.issue_description, fmtDate(m.created_at), <Badge key="b" status={m.status} />],
        }))}
      />
    </div>
  );
}
