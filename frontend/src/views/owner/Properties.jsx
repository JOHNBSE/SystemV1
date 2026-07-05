import { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import { errMsg } from '../../api.js';
import { Table, useToast } from '../../components/common.jsx';
import DataForm from '../../components/DataForm.jsx';

export default function OwnerProperties() {
  const { call } = useAuth();
  const toast = useToast();
  const [props, setProps] = useState(null);
  const [editing, setEditing] = useState(null);

  const load = () => call('GET', '/properties').then(setProps);
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!props) return <div className="loading">Loading…</div>;

  const fields = [
    { name: 'name', label: 'Name', required: true },
    { name: 'location', label: 'Location', required: true },
    { name: 'description', label: 'Description' },
  ];

  const submit = async (values) => {
    if (editing) await call('PUT', '/properties/' + editing.id, values);
    else await call('POST', '/properties', values);
    toast(editing ? 'Property updated.' : 'Property created.', true);
    setEditing(null);
    load();
  };

  const remove = async (p) => {
    if (!confirm(`Delete "${p.name}" and all its units?`)) return;
    try {
      await call('DELETE', '/properties/' + p.id);
      toast('Property deleted.', true);
      load();
    } catch (e) {
      toast(errMsg(e));
    }
  };

  return (
    <div>
      <h2>Properties</h2>
      <DataForm key={editing?.id ?? 'new'} fields={fields} initial={editing || {}} onSubmit={submit}
        submitLabel={editing ? 'Update property' : 'Save property'} />
      <Table
        heads={['Name', 'Location', 'Units', 'Description', '']}
        rows={props.map((p) => ({
          key: p.id,
          cells: [
            p.name, p.location, String((p.units || []).length), p.description || '—',
            <div className="actions" key="a">
              <button className="btn-sm" onClick={() => setEditing(p)}>Edit</button>
              <button className="btn-sm danger" onClick={() => remove(p)}>Delete</button>
            </div>,
          ],
        }))}
      />
    </div>
  );
}
