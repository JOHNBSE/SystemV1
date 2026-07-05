import { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext.jsx';
import { errMsg } from '../api.js';
import { useToast, fmtDate } from './common.jsx';
import DataForm from './DataForm.jsx';

// Shared by owner and tenant dashboards — only the list of allowed
// recipients and the name-lookup differ per role.
export default function MessagesView({ receivers, nameOf }) {
  const { user, call } = useAuth();
  const toast = useToast();
  const [messages, setMessages] = useState(null);

  const load = () => call('GET', '/messages').then(setMessages);
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!messages) return <div className="loading">Loading…</div>;

  const send = async (values) => {
    await call('POST', '/messages', values);
    toast('Message sent.', true);
    load();
  };

  const markRead = async (id) => {
    try {
      await call('PATCH', '/messages/' + id, { read_status: true });
      load();
    } catch (e) {
      toast(errMsg(e));
    }
  };

  return (
    <div>
      <h2>Messages</h2>
      {receivers.length ? (
        <DataForm
          stacked
          fields={[
            { name: 'receiver_id', label: 'To', type: 'select', options: receivers },
            { name: 'message', label: 'Message', type: 'textarea', required: true },
          ]}
          onSubmit={send}
          submitLabel="Send"
        />
      ) : (
        <div className="note">No one to message yet.</div>
      )}
      <div className="msgs">
        {messages.map((m) => {
          const mine = m.sender_id === user.id;
          return (
            <div key={m.id} className={'msg' + (mine ? ' out' : '')}>
              {m.message}
              <div className="meta">
                <span>{mine ? 'To ' + nameOf(m.receiver_id) : 'From ' + nameOf(m.sender_id)}</span>
                <span>{fmtDate(m.created_at)}</span>
                {!mine && !m.read_status && (
                  <button className="btn-sm" onClick={() => markRead(m.id)}>Mark read</button>
                )}
                {!mine && m.read_status && <span>read</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
