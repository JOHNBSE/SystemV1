import { useState } from 'react';
import { errMsg } from '../api.js';
import { useToast } from './common.jsx';

// Generic create/edit form. Pass `key={editingId ?? 'new'}` from the parent
// so switching between "new" and "editing X" remounts with fresh initial values.
export default function DataForm({ fields, initial = {}, onSubmit, submitLabel = 'Save', stacked = false }) {
  const [values, setValues] = useState(() => {
    const v = {};
    for (const f of fields) {
      if (initial[f.name] != null) v[f.name] = initial[f.name];
      // A native <select> defaults to its first option; match that here so an
      // untouched select doesn't submit '' (which Laravel treats as null).
      else if (f.type === 'select' && f.options?.length) v[f.name] = String(f.options[0].value);
      else v[f.name] = '';
    }
    return v;
  });
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const set = (name, val) => setValues((v) => ({ ...v, [name]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onSubmit(values);
    } catch (e) {
      toast(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className={'frm' + (stacked ? ' stack' : '')} onSubmit={handleSubmit}>
      {fields.map((f) => {
        const id = 'f_' + f.name;
        return (
          <div key={f.name}>
            <label htmlFor={id}>{f.label}</label>
            {f.type === 'select' ? (
              <select id={id} name={f.name} value={values[f.name]} required={f.required}
                onChange={(e) => set(f.name, e.target.value)}>
                {(f.options || []).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ) : f.type === 'textarea' ? (
              <textarea id={id} name={f.name} value={values[f.name]} required={f.required}
                onChange={(e) => set(f.name, e.target.value)} />
            ) : (
              <input id={id} name={f.name} type={f.type || 'text'} value={values[f.name]} required={f.required}
                min={f.min} step={f.type === 'number' ? (f.step || 'any') : undefined}
                onChange={(e) => set(f.name, e.target.value)} />
            )}
          </div>
        );
      })}
      <div><button className="btn" type="submit" disabled={busy}>{submitLabel}</button></div>
    </form>
  );
}
