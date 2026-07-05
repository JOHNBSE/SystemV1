import { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import { ToastProvider } from './components/common.jsx';
import Login from './components/Login.jsx';
import Shell from './components/Shell.jsx';

import OwnerOverview from './views/owner/Overview.jsx';
import OwnerProperties from './views/owner/Properties.jsx';
import OwnerUnits from './views/owner/Units.jsx';
import OwnerTenants from './views/owner/Tenants.jsx';
import OwnerPayments from './views/owner/Payments.jsx';
import OwnerMaintenance from './views/owner/Maintenance.jsx';
import OwnerMessages from './views/owner/Messages.jsx';

import TenantOverview from './views/tenant/Overview.jsx';
import TenantPayments from './views/tenant/Payments.jsx';
import TenantMaintenance from './views/tenant/Maintenance.jsx';
import TenantMessages from './views/tenant/Messages.jsx';

import AdminOverview from './views/admin/Overview.jsx';
import AdminOwners from './views/admin/Owners.jsx';

const VIEWS = {
  owner: {
    Overview: OwnerOverview, Properties: OwnerProperties, Units: OwnerUnits,
    Tenants: OwnerTenants, Payments: OwnerPayments, Maintenance: OwnerMaintenance,
    Messages: OwnerMessages,
  },
  tenant: {
    Overview: TenantOverview, Payments: TenantPayments,
    Maintenance: TenantMaintenance, Messages: TenantMessages,
  },
  admin: { Overview: AdminOverview, Owners: AdminOwners },
};

function Dashboard() {
  const { user, logout } = useAuth();
  const tabs = Object.keys(VIEWS[user.role] || {});
  const [tab, setTab] = useState(tabs[0]);
  const View = VIEWS[user.role][tabs.includes(tab) ? tab : tabs[0]];

  return (
    <Shell user={user} tabs={tabs} tab={tab} onTab={setTab} onLogout={logout}>
      <View key={tab} />
    </Shell>
  );
}

function Root() {
  const { user, booting } = useAuth();
  if (booting) return <div className="loading">Loading…</div>;
  return user ? <Dashboard /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Root />
      </ToastProvider>
    </AuthProvider>
  );
}
