'use strict';

/* All user data is rendered via textContent (el() helper) — never innerHTML.
   Auth is an HttpOnly session cookie; no token is ever stored in JS. */

const $app = document.getElementById('app');
let user = null;
let tab = '';

/* ---------- helpers ---------- */

const cookie = (name) =>
  decodeURIComponent((document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)')) || [])[1] || '');

async function api(method, path, body) {
  const res = await fetch('/api' + path, {
    method,
    credentials: 'same-origin',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-XSRF-TOKEN': cookie('XSRF-TOKEN'),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && user) {
    user = null;
    renderLogin('Session expired — please log in again.');
    throw new Error('Session expired.');
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error((data && data.message) || res.statusText);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

const csrf = () => fetch('/sanctum/csrf-cookie', { credentials: 'same-origin' });

function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (k === 'disabled' || k === 'required' || k === 'selected') { if (v) n[k] = true; }
    else n.setAttribute(k, v);
  }
  for (const c of kids.flat(2)) {
    if (c == null) continue;
    n.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return n;
}

function errMsg(e) {
  if (e.data && e.data.errors) return Object.values(e.data.errors).flat().join(' ');
  return e.message || 'Something went wrong.';
}

let toastTimer;
function toast(msg, ok = false) {
  document.querySelector('.toast')?.remove();
  const t = el('div', { class: 'toast' + (ok ? ' ok' : '') }, msg);
  document.body.append(t);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.remove(), 4000);
}

const fmtDate = (s) => (s ? String(s).slice(0, 10) : '—');
const fmtMoney = (n) => Number(n ?? 0).toLocaleString();
const badge = (s) => el('span', { class: 'badge b-' + s }, String(s).replace('_', ' '));

function table(heads, rows) {
  return el('table', { class: 'tbl' },
    el('thead', {}, el('tr', {}, heads.map((h) => el('th', {}, h)))),
    el('tbody', {},
      rows.length
        ? rows.map((r) => el('tr', {}, r.map((c) => el('td', {}, c))))
        : el('tr', {}, el('td', { class: 'empty', colspan: String(heads.length) }, 'Nothing here yet.'))));
}

function form(fields, onSubmit, label = 'Save', cls = 'frm') {
  const f = el('form', { class: cls });
  for (const fd of fields) {
    const id = 'f_' + fd.name;
    let input;
    if (fd.type === 'select') {
      input = el('select', { id, name: fd.name },
        (fd.options || []).map((o) => el('option', { value: String(o.value) }, o.label)));
    } else if (fd.type === 'textarea') {
      input = el('textarea', { id, name: fd.name });
    } else {
      input = el('input', { id, name: fd.name, type: fd.type || 'text' });
      if (fd.type === 'number') input.setAttribute('step', fd.step || 'any');
    }
    if (fd.required) input.required = true;
    if (fd.value != null) input.value = fd.value;
    if (fd.min != null) input.min = fd.min;
    f.append(el('div', {}, el('label', { for: id }, fd.label), input));
  }
  const btn = el('button', { class: 'btn', type: 'submit' }, label);
  f.append(el('div', {}, btn));
  f.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    btn.disabled = true;
    try {
      await onSubmit(Object.fromEntries(new FormData(f).entries()), f);
    } catch (e) {
      toast(errMsg(e));
    } finally {
      btn.disabled = false;
    }
  });
  return f;
}

/* ---------- auth ---------- */

function renderLogin(notice, registering = false) {
  tab = '';
  const fields = registering
    ? [
        { name: 'name', label: 'Full name', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'password', label: 'Password (min 8 chars)', type: 'password', required: true },
        { name: 'company_name', label: 'Company name (optional)' },
        { name: 'phone', label: 'Phone (optional)' },
      ]
    : [
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'password', label: 'Password', type: 'password', required: true },
      ];

  const f = form(fields, async (d) => {
    await csrf();
    const res = await api('POST', registering ? '/register' : '/login', d);
    user = res.user;
    render();
  }, registering ? 'Create owner account' : 'Sign in', 'frm stack');

  $app.replaceChildren(
    el('div', { class: 'auth-wrap' },
      el('div', { class: 'auth-card' },
        el('h1', {}, 'RentDesk'),
        el('p', { class: 'sub' }, registering ? 'Register as a property owner.' : 'Sign in to your account.'),
        notice ? el('div', { class: 'note' }, notice) : null,
        f,
        el('p', { class: 'auth-switch' },
          registering ? 'Already have an account? ' : 'Are you a landlord? ',
          el('button', { onclick: () => renderLogin(null, !registering) },
            registering ? 'Sign in' : 'Register as owner')))));
}

/* ---------- shell ---------- */

const TABS = {
  owner: ['Overview', 'Properties', 'Units', 'Tenants', 'Payments', 'Maintenance', 'Messages'],
  tenant: ['Overview', 'Payments', 'Maintenance', 'Messages'],
  admin: ['Overview', 'Owners'],
};

function render() {
  const tabs = TABS[user.role] || [];
  if (!tabs.includes(tab)) tab = tabs[0];

  const main = el('main', {}, el('div', { class: 'loading' }, 'Loading…'));

  $app.replaceChildren(
    el('header', { class: 'bar' },
      el('span', { class: 'brand' }, 'RentDesk'),
      el('nav', { class: 'tabs' },
        tabs.map((t) => el('button', { class: t === tab ? 'on' : '', onclick: () => { tab = t; render(); } }, t))),
      el('div', { class: 'who' }, el('b', {}, user.name), user.role),
      el('button', {
        class: 'btn-sm',
        onclick: async () => { try { await api('POST', '/logout'); } catch {} user = null; renderLogin(); },
      }, 'Log out')),
    main);

  VIEWS[user.role][tab]()
    .then((node) => main.replaceChildren(node))
    .catch((e) => { main.replaceChildren(el('div', { class: 'loading' }, errMsg(e))); });
}

const stat = (k, v) => el('div', { class: 'stat' }, el('div', { class: 'k' }, k), el('div', { class: 'v' }, v));

/* ---------- owner views ---------- */

async function ownerOverview() {
  const d = await api('GET', '/dashboard');
  return el('div', {},
    el('h2', {}, 'Overview'),
    el('div', { class: 'stats' },
      stat('Properties', d.properties),
      stat('Units', d.units),
      stat('Occupied', d.occupied_units),
      stat('Vacant', d.vacant_units),
      stat('Occupancy', d.occupancy_rate + '%'),
      stat('Active tenants', d.tenants),
      stat('Income this month', fmtMoney(d.income_this_month)),
      stat('Pending maintenance', d.pending_maintenance)));
}

async function ownerProperties() {
  const props = await api('GET', '/properties');
  const wrap = el('div', {}, el('h2', {}, 'Properties'));

  const f = form([
    { name: 'name', label: 'Name', required: true },
    { name: 'location', label: 'Location', required: true },
    { name: 'description', label: 'Description' },
  ], async (d, formEl) => {
    const id = formEl.dataset.id;
    if (id) await api('PUT', '/properties/' + id, d);
    else await api('POST', '/properties', d);
    toast(id ? 'Property updated.' : 'Property created.', true);
    render();
  }, 'Save property');

  wrap.append(f, table(
    ['Name', 'Location', 'Units', 'Description', ''],
    props.map((p) => [
      p.name, p.location, String((p.units || []).length), p.description || '—',
      el('div', { class: 'actions' },
        el('button', { class: 'btn-sm', onclick: () => {
          f.dataset.id = p.id;
          f.querySelector('[name=name]').value = p.name;
          f.querySelector('[name=location]').value = p.location;
          f.querySelector('[name=description]').value = p.description || '';
          f.scrollIntoView({ behavior: 'smooth' });
        } }, 'Edit'),
        el('button', { class: 'btn-sm danger', onclick: async () => {
          if (!confirm(`Delete "${p.name}" and all its units?`)) return;
          try { await api('DELETE', '/properties/' + p.id); toast('Property deleted.', true); render(); }
          catch (e) { toast(errMsg(e)); }
        } }, 'Delete')),
    ])));
  return wrap;
}

async function ownerUnits() {
  const [units, props] = await Promise.all([api('GET', '/units'), api('GET', '/properties')]);
  const propName = Object.fromEntries(props.map((p) => [p.id, p.name]));
  const wrap = el('div', {}, el('h2', {}, 'Units'));

  if (!props.length) {
    wrap.append(el('div', { class: 'note' }, 'Create a property first, then add units to it.'));
    return wrap;
  }

  const f = form([
    { name: 'property_id', label: 'Property', type: 'select', options: props.map((p) => ({ value: p.id, label: p.name })) },
    { name: 'unit_number', label: 'Unit number', required: true },
    { name: 'type', label: 'Type (e.g. bedsitter, 1BR)', required: true },
    { name: 'rent_price', label: 'Rent price', type: 'number', required: true, min: 0 },
  ], async (d, formEl) => {
    const id = formEl.dataset.id;
    if (id) {
      delete d.property_id;
      await api('PUT', '/units/' + id, d);
    } else {
      await api('POST', '/units', d);
    }
    toast(id ? 'Unit updated.' : 'Unit created.', true);
    render();
  }, 'Save unit');

  wrap.append(f, table(
    ['Property', 'Unit', 'Type', 'Rent', 'Status', ''],
    units.map((u) => [
      propName[u.property_id] || '#' + u.property_id, u.unit_number, u.type,
      fmtMoney(u.rent_price), badge(u.status),
      el('div', { class: 'actions' },
        el('button', { class: 'btn-sm', onclick: () => {
          f.dataset.id = u.id;
          f.querySelector('[name=property_id]').value = String(u.property_id);
          f.querySelector('[name=unit_number]').value = u.unit_number;
          f.querySelector('[name=type]').value = u.type;
          f.querySelector('[name=rent_price]').value = u.rent_price;
          f.scrollIntoView({ behavior: 'smooth' });
        } }, 'Edit'),
        el('button', { class: 'btn-sm danger', onclick: async () => {
          if (!confirm(`Delete unit ${u.unit_number}?`)) return;
          try { await api('DELETE', '/units/' + u.id); toast('Unit deleted.', true); render(); }
          catch (e) { toast(errMsg(e)); }
        } }, 'Delete')),
    ])));
  return wrap;
}

let pendingNote = null;

async function ownerTenants() {
  const [tenants, units] = await Promise.all([api('GET', '/tenants'), api('GET', '/units')]);
  const vacant = units.filter((u) => u.status === 'vacant');
  const wrap = el('div', {}, el('h2', {}, 'Tenants'));

  if (pendingNote) {
    wrap.append(pendingNote);
    pendingNote = null;
  }

  if (!vacant.length && !tenants.length) {
    wrap.append(el('div', { class: 'note' }, 'Add a vacant unit first, then assign a tenant to it.'));
  }

  const f = form([
    { name: 'name', label: 'Full name', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'unit_id', label: 'Assign vacant unit', type: 'select', options: vacant.map((u) => ({ value: u.id, label: `${u.unit_number} (${u.type})` })) },
    { name: 'lease_start', label: 'Lease start', type: 'date' },
    { name: 'lease_end', label: 'Lease end', type: 'date' },
  ], async (d, formEl) => {
    const id = formEl.dataset.id;
    if (id) {
      await api('PUT', '/tenants/' + id, { lease_start: d.lease_start || null, lease_end: d.lease_end || null });
      toast('Tenant updated.', true);
      render();
      return;
    }
    if (!d.unit_id) throw new Error('No vacant unit available to assign.');
    const res = await api('POST', '/tenants', d);
    // Shown once — the backend never stores or re-displays the plaintext password.
    pendingNote = el('div', { class: 'note' },
      'Tenant account created. Temporary password for ', res.tenant.user.email, ': ',
      el('code', {}, res.temporary_password),
      ' — share it securely; it is shown only once.');
    render();
  }, 'Save tenant');

  wrap.append(f, table(
    ['Tenant', 'Email', 'Unit', 'Lease', 'Status', ''],
    tenants.map((t) => [
      t.user?.name || '—', t.user?.email || '—',
      t.unit ? `${t.unit.unit_number} — ${t.unit.property?.name ?? ''}` : '—',
      `${fmtDate(t.lease_start)} → ${fmtDate(t.lease_end)}`,
      badge(t.status),
      el('div', { class: 'actions' },
        el('button', { class: 'btn-sm', onclick: () => {
          f.dataset.id = t.id;
          f.querySelector('[name=name]').value = t.user?.name || '';
          f.querySelector('[name=email]').value = t.user?.email || '';
          f.querySelector('[name=lease_start]').value = fmtDate(t.lease_start) !== '—' ? fmtDate(t.lease_start) : '';
          f.querySelector('[name=lease_end]').value = fmtDate(t.lease_end) !== '—' ? fmtDate(t.lease_end) : '';
          f.scrollIntoView({ behavior: 'smooth' });
        } }, 'Edit lease'),
        t.status === 'active'
          ? el('button', { class: 'btn-sm', onclick: async () => {
              if (!confirm(`End ${t.user?.name}'s lease?`)) return;
              try { await api('PUT', '/tenants/' + t.id, { status: 'ended' }); toast('Lease ended.', true); render(); }
              catch (e) { toast(errMsg(e)); }
            } }, 'End lease')
          : null,
        el('button', { class: 'btn-sm danger', onclick: async () => {
          if (!confirm(`Remove ${t.user?.name} and their account?`)) return;
          try { await api('DELETE', '/tenants/' + t.id); toast('Tenant removed.', true); render(); }
          catch (e) { toast(errMsg(e)); }
        } }, 'Remove')),
    ])));
  return wrap;
}

async function ownerPayments() {
  const [payments, tenants] = await Promise.all([api('GET', '/payments'), api('GET', '/tenants')]);
  const active = tenants.filter((t) => t.status === 'active');
  const wrap = el('div', {}, el('h2', {}, 'Payments'));

  if (active.length) {
    wrap.append(form([
      { name: 'tenant_id', label: 'Tenant', type: 'select', options: active.map((t) => ({ value: t.id, label: `${t.user?.name} (${t.unit?.unit_number ?? '—'})` })) },
      { name: 'amount', label: 'Amount', type: 'number', required: true, min: 0.01 },
      { name: 'date_paid', label: 'Date paid', type: 'date', required: true, value: new Date().toISOString().slice(0, 10) },
      { name: 'method', label: 'Method', type: 'select', options: ['cash', 'mpesa', 'bank', 'card'].map((m) => ({ value: m, label: m })) },
    ], async (d) => {
      await api('POST', '/payments', d);
      toast('Payment recorded.', true);
      render();
    }, 'Record payment'));
  }

  wrap.append(table(
    ['Tenant', 'Unit', 'Amount', 'Date', 'Method', 'Status', ''],
    payments.map((p) => [
      p.tenant?.user?.name || '#' + p.tenant_id,
      p.unit?.unit_number || '—',
      fmtMoney(p.amount), fmtDate(p.date_paid), p.method, badge(p.status),
      el('div', { class: 'actions' },
        p.status === 'pending'
          ? el('button', { class: 'btn-sm', onclick: async () => {
              try { await api('PUT', '/payments/' + p.id, { status: 'completed' }); toast('Payment approved.', true); render(); }
              catch (e) { toast(errMsg(e)); }
            } }, 'Approve')
          : null,
        p.status === 'pending'
          ? el('button', { class: 'btn-sm danger', onclick: async () => {
              try { await api('PUT', '/payments/' + p.id, { status: 'failed' }); toast('Payment rejected.', true); render(); }
              catch (e) { toast(errMsg(e)); }
            } }, 'Reject')
          : null,
        el('button', { class: 'btn-sm danger', onclick: async () => {
          if (!confirm('Delete this payment record?')) return;
          try { await api('DELETE', '/payments/' + p.id); toast('Payment deleted.', true); render(); }
          catch (e) { toast(errMsg(e)); }
        } }, 'Delete')),
    ])));
  return wrap;
}

async function ownerMaintenance() {
  const reqs = await api('GET', '/maintenance-requests');
  return el('div', {},
    el('h2', {}, 'Maintenance requests'),
    table(
      ['Tenant', 'Unit', 'Issue', 'Reported', 'Status'],
      reqs.map((m) => [
        m.tenant?.user?.name || '#' + m.tenant_id,
        m.unit?.unit_number || '—',
        m.issue_description, fmtDate(m.created_at),
        el('select', {
          onchange: async (e) => {
            try { await api('PUT', '/maintenance-requests/' + m.id, { status: e.target.value }); toast('Status updated.', true); }
            catch (err) { toast(errMsg(err)); render(); }
          },
        }, ['open', 'in_progress', 'resolved'].map((s) =>
          el('option', { value: s, selected: s === m.status }, s.replace('_', ' ')))),
      ])));
}

async function ownerMessages() {
  const [messages, tenants] = await Promise.all([api('GET', '/messages'), api('GET', '/tenants')]);
  const names = Object.fromEntries(tenants.map((t) => [t.user_id, t.user?.name || 'Tenant']));
  return messagesView(messages,
    tenants.filter((t) => t.status === 'active').map((t) => ({ value: t.user_id, label: t.user?.name || 'Tenant' })),
    (id) => names[id] || 'User #' + id);
}

/* ---------- tenant views ---------- */

async function tenantOverview() {
  const d = await api('GET', '/dashboard');
  if (d.message) return el('div', {}, el('h2', {}, 'Overview'), el('div', { class: 'note' }, d.message));
  return el('div', {},
    el('h2', {}, 'My tenancy'),
    el('div', { class: 'stats' },
      stat('Property', d.property?.name || '—'),
      stat('Unit', d.unit ? `${d.unit.unit_number} (${d.unit.type})` : '—'),
      stat('Monthly rent', fmtMoney(d.rent_price)),
      stat('Lease', `${fmtDate(d.lease_start)} → ${fmtDate(d.lease_end)}`),
      stat('Total paid', fmtMoney(d.total_paid)),
      stat('Last payment', d.last_payment ? `${fmtMoney(d.last_payment.amount)} on ${fmtDate(d.last_payment.date_paid)}` : '—'),
      stat('Open requests', d.open_maintenance_requests)));
}

async function tenantPayments() {
  const payments = await api('GET', '/payments');
  const wrap = el('div', {}, el('h2', {}, 'My payments'));
  wrap.append(
    el('div', { class: 'note' }, 'Submitted payments are marked pending until your landlord confirms them.'),
    form([
      { name: 'amount', label: 'Amount', type: 'number', required: true, min: 0.01 },
      { name: 'method', label: 'Method', type: 'select', options: ['cash', 'mpesa', 'bank', 'card'].map((m) => ({ value: m, label: m })) },
    ], async (d) => {
      await api('POST', '/payments', d);
      toast('Payment submitted for confirmation.', true);
      render();
    }, 'Submit payment'),
    table(
      ['Amount', 'Date', 'Method', 'Status'],
      payments.map((p) => [fmtMoney(p.amount), fmtDate(p.date_paid), p.method, badge(p.status)])));
  return wrap;
}

async function tenantMaintenance() {
  const reqs = await api('GET', '/maintenance-requests');
  const wrap = el('div', {}, el('h2', {}, 'Maintenance requests'));
  wrap.append(
    form([
      { name: 'issue_description', label: 'Describe the issue', type: 'textarea', required: true },
    ], async (d) => {
      await api('POST', '/maintenance-requests', d);
      toast('Request submitted.', true);
      render();
    }, 'Report issue', 'frm stack'),
    table(
      ['Issue', 'Reported', 'Status'],
      reqs.map((m) => [m.issue_description, fmtDate(m.created_at), badge(m.status)])));
  return wrap;
}

async function tenantMessages() {
  const [messages, d] = await Promise.all([api('GET', '/messages'), api('GET', '/dashboard')]);
  const ownerId = d.property?.owner_id;
  return messagesView(messages,
    ownerId ? [{ value: ownerId, label: 'My landlord' }] : [],
    () => 'Landlord');
}

/* ---------- shared messages view ---------- */

function messagesView(messages, receivers, nameOf) {
  const wrap = el('div', {}, el('h2', {}, 'Messages'));

  if (receivers.length) {
    wrap.append(form([
      { name: 'receiver_id', label: 'To', type: 'select', options: receivers },
      { name: 'message', label: 'Message', type: 'textarea', required: true },
    ], async (d) => {
      await api('POST', '/messages', d);
      toast('Message sent.', true);
      render();
    }, 'Send', 'frm stack'));
  } else {
    wrap.append(el('div', { class: 'note' }, 'No one to message yet.'));
  }

  wrap.append(el('div', { class: 'msgs' },
    messages.map((m) => {
      const mine = m.sender_id === user.id;
      return el('div', { class: 'msg' + (mine ? ' out' : '') },
        m.message,
        el('div', { class: 'meta' },
          mine ? 'To ' + nameOf(m.receiver_id) : 'From ' + nameOf(m.sender_id),
          fmtDate(m.created_at),
          !mine && !m.read_status
            ? el('button', { class: 'btn-sm', onclick: async () => {
                try { await api('PATCH', '/messages/' + m.id, { read_status: true }); render(); }
                catch (e) { toast(errMsg(e)); }
              } }, 'Mark read')
            : (mine ? null : 'read')));
    })));
  return wrap;
}

/* ---------- admin views ---------- */

async function adminOverview() {
  const d = await api('GET', '/admin/analytics');
  return el('div', {},
    el('h2', {}, 'Platform analytics'),
    el('div', { class: 'stats' },
      stat('Owners', d.owners),
      stat('Tenants', d.tenants),
      stat('Properties', d.properties),
      stat('Units', d.units),
      stat('Occupied units', d.occupied_units),
      stat('Open maintenance', d.open_maintenance_requests),
      stat('Total revenue', fmtMoney(d.revenue_total)),
      stat('Tenant profiles', d.tenant_profiles)));
}

async function adminOwners() {
  const owners = await api('GET', '/admin/owners');
  return el('div', {},
    el('h2', {}, 'Property owners'),
    table(
      ['Name', 'Email', 'Company', 'Properties', 'Tenants', 'Status', ''],
      owners.map((o) => [
        o.name, o.email, o.owner_profile?.company_name || '—',
        String(o.properties_count), String(o.tenants_count), badge(o.status),
        el('button', {
          class: 'btn-sm' + (o.status === 'active' ? ' danger' : ''),
          onclick: async () => {
            const action = o.status === 'active' ? 'suspend' : 'activate';
            if (!confirm(`${action[0].toUpperCase() + action.slice(1)} ${o.name}?`)) return;
            try { await api('POST', `/admin/owners/${o.id}/${action}`); toast('Owner ' + action + 'd.', true); render(); }
            catch (e) { toast(errMsg(e)); }
          },
        }, o.status === 'active' ? 'Suspend' : 'Activate'),
      ])));
}

/* ---------- view registry + boot ---------- */

const VIEWS = {
  owner: {
    'Overview': ownerOverview, 'Properties': ownerProperties, 'Units': ownerUnits,
    'Tenants': ownerTenants, 'Payments': ownerPayments, 'Maintenance': ownerMaintenance,
    'Messages': ownerMessages,
  },
  tenant: {
    'Overview': tenantOverview, 'Payments': tenantPayments,
    'Maintenance': tenantMaintenance, 'Messages': tenantMessages,
  },
  admin: { 'Overview': adminOverview, 'Owners': adminOwners },
};

(async function boot() {
  try {
    user = await api('GET', '/user');
    render();
  } catch {
    renderLogin();
  }
})();
