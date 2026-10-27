import { adminComplaintsRequest } from '../../api/admin.js';
import ComplaintBrowser from '../../components/ComplaintBrowser.jsx';

export default function AllComplaints() {
  return <ComplaintBrowser title="All complaints" fetcher={adminComplaintsRequest} basePath="/admin/complaints" isAdmin />;
}
