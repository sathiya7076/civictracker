import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createComplaintRequest } from '../api/complaints.js';
import ErrorMessage from '../components/ErrorMessage.jsx';
import FormField from '../components/FormField.jsx';
import ImagePreview from '../components/ImagePreview.jsx';
import { compressAll } from '../utils/compressImage.js';
import { CATEGORIES, IMAGE_TYPES, MAX_IMAGES, MAX_IMAGE_BYTES } from '../utils/constants.js';
import { getErrorMessage } from '../utils/getErrorMessage.js';

const emptyForm = { title: '', category: '', description: '', address: '', latitude: '', longitude: '' };

export default function CreateComplaint() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [locationMsg, setLocationMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleFiles = (e) => {
    const picked = Array.from(e.target.files);
    e.target.value = '';
    const problems = [];
    const accepted = [];
    for (const f of picked) {
      if (!IMAGE_TYPES.includes(f.type)) problems.push(`${f.name}: only JPEG, PNG or WebP`);
      else if (f.size > MAX_IMAGE_BYTES) problems.push(`${f.name}: larger than 5 MB`);
      else accepted.push(f);
    }
    const combined = [...files, ...accepted];
    if (combined.length > MAX_IMAGES) problems.push(`You can add at most ${MAX_IMAGES} photos`);
    setFiles(combined.slice(0, MAX_IMAGES));
    setErrors((prev) => ({ ...prev, images: problems.join('. ') }));
  };

  const useMyLocation = () => {
    setLocationMsg('');
    if (!navigator.geolocation) {
      setLocationMsg('Location is not available in this browser. You can type the coordinates or leave them empty.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, latitude: pos.coords.latitude.toFixed(6), longitude: pos.coords.longitude.toFixed(6) }));
        setLocationMsg('Location added.');
      },
      () => setLocationMsg('Could not get your location. You can type the coordinates or leave them empty.')
    );
  };

  const validate = () => {
    const next = {};
    if (form.title.trim().length < 5) next.title = 'Title must be at least 5 characters';
    if (!CATEGORIES.includes(form.category)) next.category = 'Choose a category';
    if (form.description.trim().length < 10) next.description = 'Description must be at least 10 characters';
    if (form.address.trim().length < 5) next.address = 'Address must be at least 5 characters';
    const hasLat = form.latitude !== '';
    const hasLng = form.longitude !== '';
    if (hasLat !== hasLng) next.latitude = 'Provide both latitude and longitude, or neither';
    if (hasLat && (Number.isNaN(Number(form.latitude)) || Math.abs(Number(form.latitude)) > 90)) next.latitude = 'Latitude must be between -90 and 90';
    if (hasLng && (Number.isNaN(Number(form.longitude)) || Math.abs(Number(form.longitude)) > 180)) next.longitude = 'Longitude must be between -180 and 180';
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const found = validate();
    setErrors((prev) => ({ images: prev.images, ...found }));
    if (Object.keys(found).length) return;

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (String(value).trim() !== '') data.append(key, String(value).trim());
    });

    setSubmitting(true);
    try {
      const photos = await compressAll(files);
      photos.forEach((f) => data.append('images', f));
      const res = await createComplaintRequest(data);
      navigate(`/complaints/${res.data.data.complaint._id}`, { replace: true, state: { created: true } });
    } catch (err) {
      setApiError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card max-w-2xl">
      <h1 className="text-2xl font-bold text-navy-900">Report an issue</h1>
      <p className="mt-1 text-sm text-slate-600">Your report is stored in CivicTrack. It is not automatically sent to any municipality.</p>
      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        <ErrorMessage message={apiError} />
        <FormField label="Title" name="title" value={form.title} onChange={handleChange} error={errors.title} maxLength={120} />
        <FormField label="Category" name="category" as="select" value={form.category} onChange={handleChange} error={errors.category}>
          <option value="">Select a category</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </FormField>
        <FormField label="Description" name="description" as="textarea" rows={4} value={form.description} onChange={handleChange} error={errors.description} maxLength={2000} />
        <FormField label="Address or landmark" name="address" value={form.address} onChange={handleChange} error={errors.address} hint="Where is the problem? A street or landmark is enough." />

        <fieldset className="space-y-3 rounded-md border border-slate-200 p-4">
          <legend className="px-1 text-sm font-medium text-slate-700">Map location (optional)</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Latitude" name="latitude" inputMode="decimal" value={form.latitude} onChange={handleChange} error={errors.latitude} />
            <FormField label="Longitude" name="longitude" inputMode="decimal" value={form.longitude} onChange={handleChange} error={errors.longitude} />
          </div>
          <button type="button" className="btn-secondary" onClick={useMyLocation}>Use my current location</button>
          {locationMsg && <p role="status" className="text-xs text-slate-600">{locationMsg}</p>}
        </fieldset>

        <div>
          <label htmlFor="photos" className="mb-1 block text-sm font-medium text-slate-700">Photos (optional, up to {MAX_IMAGES})</label>
          <input id="photos" type="file" accept={IMAGE_TYPES.join(',')} multiple onChange={handleFiles} className="block w-full text-sm" disabled={files.length >= MAX_IMAGES} />
          {errors.images && <p role="alert" className="mt-1 text-xs text-red-700">{errors.images}</p>}
          <ImagePreview files={files} onRemove={(i) => setFiles((fs) => fs.filter((_, idx) => idx !== i))} />
        </div>

        <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit complaint'}</button>
      </form>
    </div>
  );
}