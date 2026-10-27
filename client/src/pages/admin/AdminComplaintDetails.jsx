import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { assignRequest, listUsersRequest, priorityRequest, rejectRequest, verifyRequest } from '../../api/admin.js';
import ComplaintSummary from '../../components/ComplaintSummary.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import FormField from '../../components/FormField.jsx';
import Spinner from '../../components/Spinner.jsx';
import Timeline from '../../components/Timeline.jsx';
import { useComplaint } from '../../hooks/useComplaint.js';
import { PRIORITIES } from '../../utils/constants.js';
import { getErrorMessage } from '../../utils/getErrorMessage.js';

export default function AdminComplaintDetails() {
  const { id } = useParams();
  const { complaint, updates, loading, error, reload } = useComplaint(id);
  const [staffList, setStaffList] = useState([]);
  const [staffId, setStaffId] = useState('');
  const [priority, setPriority] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [message, setMessage] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);

  useEffect(() => {
    listUsersRequest({ role: 'staff', status: 'active', limit: 50 })
      .then((res) => setStaffList(res.data.data.items))
      .catch(() => setStaffList([]));
  }, []);

  useEffect(() => {
    if (complaint) {
      setPriority(complaint.priority);
      setStaffId(complaint.assignedStaffId?._id || '');
    }
  }, [complaint]);

  const run = async (fn, success) => {
    setBusy(true);
    setActionError('');
    setMessage('');
    try {
      await fn();
      setNote('');
      setRejectOpen(false);
      reload();
      setMessage(success);
    } catch (err) {
      setRejectOpen(false);
      setActionError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading && !complaint) return <Spinner />;
  if (error && !complaint) {
    return (
      <div className="space-y-4">
        <ErrorMessage message={error} />
        <Link to="/admin/complaints" className="btn-secondary">Back to all complaints</Link>
      </div>
    );
  }
  if (!complaint) return <Spinner />;

  const { status } = complaint;
  const canAssign = status === 'Pending' || status === 'Assigned';

  return (
    <div className="space-y-6">
      <Link to="/admin/complaints" className="text-sm text-navy-700 underline">Back to all complaints</Link>
      <ComplaintSummary complaint={complaint} showCitizen />

      <section className="card space-y-5" aria-labelledby="admin-actions">
        <h2 id="admin-actions" className="text-lg font-semibold text-navy-900">Manage complaint</h2>
        <div role="status">{message && <p className="text-sm text-green-700">{message}</p>}</div>
        <ErrorMessage message={actionError} />

        <div className="flex flex-wrap items-end gap-3">
          <FormField label="Priority" as="select" value={priority} onChange={(e) => setPriority(e.target.value)} className="w-40">
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </FormField>
          <button type="button" className="btn-secondary" disabled={busy || priority === complaint.priority} onClick={() => run(() => priorityRequest(id, { priority }), 'Priority updated.')}>
            Save priority
          </button>
        </div>

        {canAssign ? (
          <div className="flex flex-wrap items-end gap-3">
            <FormField label={status === 'Assigned' ? 'Reassign to' : 'Assign to'} as="select" value={staffId} onChange={(e) => setStaffId(e.target.value)} className="w-64">
              <option value="">Select staff member</option>
              {staffList.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </FormField>
            <button type="button" className="btn-primary" disabled={busy || !staffId || staffId === complaint.assignedStaffId?._id} onClick={() => run(() => assignRequest(id, { staffId }), 'Complaint assigned.')}>
              {status === 'Assigned' ? 'Reassign' : 'Assign'}
            </button>
            {staffList.length === 0 && <p className="text-xs text-slate-500">No active staff yet. Create one under Staff.</p>}
          </div>
        ) : (
          <p className="text-sm text-slate-600">Assignment is only possible while a complaint is Pending or Assigned.</p>
        )}

        {(status === 'Resolved' || status === 'Pending' || status === 'Assigned') && (
          <div className="space-y-3 border-t border-slate-200 pt-4">
            <FormField label={status === 'Resolved' ? 'Note (required to reopen)' : 'Reason (required to reject)'} as="textarea" rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
            <div className="flex flex-wrap gap-3">
              {status === 'Resolved' && (
                <>
                  <button type="button" className="btn-primary" disabled={busy || complaint.resolutionEvidence.length === 0} onClick={() => run(() => verifyRequest(id, { action: 'close', note }), 'Complaint closed.')}>
                    Verify and close
                  </button>
                  <button type="button" className="btn-secondary" disabled={busy || note.trim().length === 0} onClick={() => run(() => verifyRequest(id, { action: 'reopen', note }), 'Complaint reopened.')}>
                    Reopen
                  </button>
                  {complaint.resolutionEvidence.length === 0 && <p className="self-center text-xs text-slate-500">Closing needs at least one evidence photo from staff.</p>}
                </>
              )}
              {(status === 'Pending' || status === 'Assigned') && (
                <button type="button" className="btn-secondary text-red-700" disabled={busy || note.trim().length < 5} onClick={() => setRejectOpen(true)}>
                  Reject complaint
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      <Timeline updates={updates} />

      <ConfirmDialog
        open={rejectOpen}
        title="Reject this complaint?"
        message="The citizen will be notified. A rejected complaint cannot be reopened."
        confirmLabel="Reject"
        busy={busy}
        onConfirm={() => run(() => rejectRequest(id, { note }), 'Complaint rejected.')}
        onCancel={() => setRejectOpen(false)}
      />
    </div>
  );
}
