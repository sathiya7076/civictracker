import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { cancelComplaintRequest } from '../api/complaints.js';
import ComplaintSummary from '../components/ComplaintSummary.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Spinner from '../components/Spinner.jsx';
import Timeline from '../components/Timeline.jsx';
import { useComplaint } from '../hooks/useComplaint.js';
import { getErrorMessage } from '../utils/getErrorMessage.js';

export default function ComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { complaint, updates, loading, error } = useComplaint(id);
  const [actionError, setActionError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelComplaintRequest(id);
      navigate('/complaints', { replace: true });
    } catch (err) {
      setConfirmOpen(false);
      setActionError(getErrorMessage(err));
      setCancelling(false);
    }
  };

  if (loading) return <Spinner />;
  if (error) {
    return (
      <div className="space-y-4">
        <ErrorMessage message={error} />
        <Link to="/complaints" className="btn-secondary">Back to my complaints</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {location.state?.created && (
        <div role="status" className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Complaint submitted. Your reference ID is <strong>{complaint.complaintId}</strong>.
        </div>
      )}
      <ErrorMessage message={actionError} />

      <ComplaintSummary complaint={complaint}>
        {complaint.status === 'Pending' && (
          <div className="mt-6 border-t border-slate-200 pt-4">
            <button type="button" className="btn-secondary text-red-700" onClick={() => setConfirmOpen(true)}>Cancel this complaint</button>
          </div>
        )}
      </ComplaintSummary>

      <Timeline updates={updates} />

      <ConfirmDialog
        open={confirmOpen}
        title="Cancel this complaint?"
        message="The complaint and its timeline will be permanently deleted. This cannot be undone."
        confirmLabel="Yes, cancel it"
        busy={cancelling}
        onConfirm={handleCancel}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
