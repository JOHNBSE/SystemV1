import { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import { errMsg } from '../../api.js';
import { Table, Badge, useToast, fmtMoney } from '../../components/common.jsx';
import DataForm from '../../components/DataForm.jsx';

export default function OwnerUnits() {
  const { call } = useAuth();
  const toast = useToast();
  const [units, setUnits] = useState(null);
  const [props, setProps] = useState(null);
  const [editing, setEditing] = useState(null);

  const load = () => Promise.all([call('GET', '/units'), call('GET', '/properties')]).then(([u, p]) => { setUnits(u); setProps(p); });
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!units || !props) return <div className="loading">Loading…</div>;

  if (!props.length) {
    return (
      <div>
        <h2>Units</h2>
        <div className="note">Create a property first, then add units to it.</div>
      </div>
    );
  }

  const propName = Object.fromEntries(props.map((p) => [p.id, p.name]));

  const fields = editing
    ? [
        { name: 'unit_number', label: 'Unit number', required: true },
        { name: 'type', label: 'Type (e.g. bedsitter, 1BR)', required: true },
        { name: 'rent_price', label: 'Rent price', type: 'number', required: true, min: 0 },
      ]
    : [
        { name: 'property_id', label: 'Property', type: 'select', options: props.map((p) => ({ value: p.id, label: p.name })) },
        { name: 'unit_number', label: 'Unit number', required: true },
        { name: 'type', label: 'Type (e.g. bedsitter, 1BR)', required: true },
        { name: 'rent_price', label: 'Rent price', type: 'number', required: true, min: 0 },
      ];

  const submit = async (values) => {
    if (editing) {
      const { property_id, ...rest } = values; // eslint-disable-line no-unused-vars
      await call('PUT', '/units/' + editing.id, rest);
    } else {
      await call('POST', '/units', values);
    }
    toast(editing ? 'Unit updated.' : 'Unit created.', true);
    setEditing(null);
    load();
  };

  const remove = async (u) => {
    if (!confirm(`Delete unit ${u.unit_number}?`)) return;
    try {
      await call('DELETE', '/units/' + u.id);
      toast('Unit deleted.', true);
      load();
    } catch (e) {
      toast(errMsg(e));
    }
  };

  return (
    <div>
      <h2>Units</h2>
      <DataForm
        key={editing?.id ?? 'new'}
        fields={fields}
        initial={editing ? { ...editing, property_id: String(editing.property_id) } : { property_id: String(props[0].id) }}
        onSubmit={submit}
        submitLabel={editing ? 'Update unit' : 'Save unit'}
      />
      <Table
        heads={['Property', 'Unit', 'Type', 'Rent', 'Status', '']}
        rows={units.map((u) => ({
          key: u.id,
          cells: [
            propName[u.property_id] || '#' + u.property_id, u.unit_number, u.type,
            fmtMoney(u.rent_price), <Badge key="b" status={u.status} />,
            <div className="actions" key="a">
              <button className="btn-sm" onClick={() => setEditing(u)}>Edit</button>
              <button className="btn-sm danger" onClick={() => remove(u)}>Delete</button>
            </div>,
          ],
        }))}
      />
    </div>
  );
}
