import { useState } from 'react';
import { useAuth } from '../AuthContext.jsx';
import { errMsg } from '../api.js';
import DataForm from './DataForm.jsx';

export default function Login({ notice }) {
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState(notice || null);
  const { login, register } = useAuth();

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

  const submit = async (values) => {
    try {
      if (registering) await register(values);
      else await login(values.email, values.password);
    } catch (e) {
      setError(errMsg(e));
      throw e;
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>RentDesk</h1>
        <p className="sub">{registering ? 'Register as a property owner.' : 'Sign in to your account.'}</p>
        {error && <div className="note">{error}</div>}
        <DataForm
          key={registering ? 'register' : 'login'}
          fields={fields}
          onSubmit={submit}
          submitLabel={registering ? 'Create owner account' : 'Sign in'}
          stacked
        />
        <p className="auth-switch">
          {registering ? 'Already have an account? ' : 'Are you a landlord? '}
          <button onClick={() => { setError(null); setRegistering((r) => !r); }}>
            {registering ? 'Sign in' : 'Register as owner'}
          </button>
        </p>
      </div>
    </div>
  );
}
