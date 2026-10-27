import { listAssignedRequest } from '../../api/staff.js';
import ComplaintBrowser from '../../components/ComplaintBrowser.jsx';

export default function AssignedComplaints() {
  return <ComplaintBrowser title="Assigned complaints" fetcher={listAssignedRequest} basePath="/staff/complaints" />;
}
