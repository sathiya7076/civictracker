import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import FormField from '../components/FormField.jsx';
import { getErrorMessage } from '../utils/getErrorMessage.js';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Name must be at least 2 characters';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address';
    if (form.phone && !/^[0-9+\-\s()]{7,20}$/.test(form.phone)) next.phone = 'Enter a valid phone number';
    if (form.password.length < 8) next.password = 'Password must be at least 8 characters';
    else if (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) next.password = 'Use at least one letter and one number';
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match';
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), password: form.password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setApiError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card mx-auto max-w-md">
      <h1 className="text-2xl font-bold text-navy-900">Create your account</h1>
      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        <ErrorMessage message={apiError} />
        <FormField label="Full name" name="name" autoComplete="name" value={form.name} onChange={handleChange} error={errors.name} />
        <FormField label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} error={errors.email} />
        <FormField label="Phone (optional)" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={handleChange} error={errors.phone} />
        <FormField label="Password" name="password" type="password" autoComplete="new-password" hint="At least 8 characters, with a letter and a number." value={form.password} onChange={handleChange} error={errors.password} />
        <FormField label="Confirm password" name="confirmPassword" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} />
        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Register'}
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        Already registered? <Link to="/login" className="font-medium text-navy-700 underline">Log in</Link>
      </p>
    </div>
  );
}
