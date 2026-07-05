import { createContext, useCallback, useContext, useRef, useState } from 'react';

/* JSX escapes all text content by default — no dangerouslySetInnerHTML
   anywhere in this app, so rendered tenant/owner-supplied strings can't
   inject markup. */

export function StatCard({ k, v }) {
  return (
    <div className="stat">
      <div className="k">{k}</div>
      <div className="v">{v}</div>
    </div>
  );
}

export function Badge({ status }) {
  return <span className={'badge b-' + status}>{String(status).replace('_', ' ')}</span>;
}

export function Table({ heads, rows }) {
  return (
    <table className="tbl">
      <thead>
        <tr>{heads.map((h) => <th key={h}>{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.length ? (
          rows.map((r, i) => (
            <tr key={r.key ?? i}>
              {r.cells.map((c, j) => <td key={j}>{c}</td>)}
            </tr>
          ))
        ) : (
          <tr><td className="empty" colSpan={heads.length}>Nothing here yet.</td></tr>
        )}
      </tbody>
    </table>
  );
}

const ToastCtx = createContext(() => {});

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef();

  const show = useCallback((msg, ok = false) => {
    clearTimeout(timer.current);
    setToast({ msg, ok });
    timer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  return (
    <ToastCtx.Provider value={show}>
      {children}
      {toast && <div className={'toast' + (toast.ok ? ' ok' : '')}>{toast.msg}</div>}
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);

export const fmtDate = (s) => (s ? String(s).slice(0, 10) : '—');
export const fmtMoney = (n) => Number(n ?? 0).toLocaleString();
