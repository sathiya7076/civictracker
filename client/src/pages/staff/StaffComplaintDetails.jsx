import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { staffUpdateStatusRequest, staffUploadEvidenceRequest } from '../../api/staff.js';
import ComplaintSummary from '../../components/ComplaintSummary.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import FormField from '../../components/FormField.jsx';
import ImagePreview from '../../components/ImagePreview.jsx';
import Spinner from '../../components/Spinner.jsx';
import Timeline from '../../components/Timeline.jsx';
import { useComplaint } from '../../hooks/useComplaint.js';
import { compressAll } from '../../utils/compressImage.js';
import { IMAGE_TYPES, MAX_IMAGES } from '../../utils/constants.js';
import { getErrorMessage } from '../../utils/getErrorMessage.js';
import { mergeImageFiles } from '../../utils/imageFiles.js';

// Work details + progress updates for one assigned complaint.
export default function StaffComplaintDetails() {
  const { id } = useParams();
  const { complaint, updates, loading, error, reload } = useComplaint(id);
  const [note, setNote] = useState('');
  const [files, setFiles] = useState([]);
  const [fileProblem, setFileProblem] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [message, setMessage] = useState('');

  const run = async (fn, success) => {
    setBusy(true);
    setActionError('');
    setMessage('');
    try {
      await fn();
      setNote('');
      setFiles([]);
      reload();
      setMessage(success);
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = (status, success) => run(() => staffUpdateStatusRequest(id, { status, note }), success);

  const uploadEvidence = () =>
    run(async () => {
      const data = new FormData();
      (await compressAll(files)).forEach((f) => data.append('images', f));
      if (note.trim()) data.append('note', note.trim());
      return staffUploadEvidenceRequest(id, data);
    }, 'Evidence uploaded.');

  const handleFiles = (e) => {
    const result = mergeImageFiles(files, Array.from(e.target.files));
    e.target.value = '';
    setFiles(result.files);
    setFileProblem(result.problem);
  };

  if (loading && !complaint) return <Spinner />;
  if (error && !complaint) {
    return (
      <div className="space-y-4">
        <ErrorMessage message={error} />
        <Link to="/staff/complaints" className="btn-secondary">Back to assigned complaints</Link>
      </div>
    );
  }
  if (!complaint) return <Spinner />;

  const { status } = complaint;
  const canWork = status === 'Assigned' || status === 'In Progress';
  const canAddEvidence = status === 'In Progress' || status === 'Resolved';

  return (
    <div className="space-y-6">
      <Link to="/staff/complaints" className="text-sm text-navy-700 underline">Back to assigned complaints</Link>
      <ComplaintSummary complaint={complaint} showCitizen />

      <section className="card" aria-labelledby="update-title">
        <h2 id="update-title" className="text-lg font-semibold text-navy-900">Update progress</h2>
        <div role="status">{message && <p className="mt-2 text-sm text-green-700">{message}</p>}</div>
        <ErrorMessage message={actionError} />

        {status === 'Resolved' && <p className="mt-2 text-sm text-slate-600">Marked as resolved. Waiting for the administrator to verify the evidence.</p>}
        {!canWork && !canAddEvidence && <p className="mt-2 text-sm text-slate-600">This complaint is {status}. No further work is needed.</p>}

        {(canWork || canAddEvidence) && (
          <div className="mt-4 space-y-4">
            <FormField label="Note (optional)" as="textarea" rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />

            {canAddEvidence && (
              <div>
                <label htmlFor="evidence" className="mb-1 block text-sm font-medium text-slate-700">Before / after photos (up to {MAX_IMAGES})</label>
                <input id="evidence" type="file" accept={IMAGE_TYPES.join(',')} multiple onChange={handleFiles} className="block w-full text-sm" />
                {fileProblem && <p role="alert" className="mt-1 text-xs text-red-700">{fileProblem}</p>}
                <ImagePreview files={files} onRemove={(i) => setFiles((fs) => fs.filter((_, idx) => idx !== i))} />
                <button type="button" className="btn-secondary mt-3" disabled={busy || files.length === 0} onClick={uploadEvidence}>
                  Upload photos
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-4">
              {status === 'Assigned' && (
                <button type="button" className="btn-primary" disabled={busy} onClick={() => changeStatus('In Progress', 'Work started.')}>Start work</button>
              )}
              {status === 'In Progress' && (
                <>
                  <button type="button" className="btn-primary" disabled={busy} onClick={() => changeStatus('Resolved', 'Marked as resolved.')}>Mark as resolved</button>
                  {complaint.resolutionEvidence.length === 0 && (
                    <p className="self-center text-xs text-slate-500">Tip: upload completion photos first. The administrator needs evidence to close the complaint.</p>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </section>

      <Timeline updates={updates} />
    </div>
  );
}