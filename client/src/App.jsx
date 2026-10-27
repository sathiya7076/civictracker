import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import DashboardLayout from './components/DashboardLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CreateComplaint from './pages/CreateComplaint.jsx';
import MyComplaints from './pages/MyComplaints.jsx';
import ComplaintDetails from './pages/ComplaintDetails.jsx';
import AssignedComplaints from './pages/staff/AssignedComplaints.jsx';
import StaffComplaintDetails from './pages/staff/StaffComplaintDetails.jsx';
import AllComplaints from './pages/admin/AllComplaints.jsx';
import AdminComplaintDetails from './pages/admin/AdminComplaintDetails.jsx';
import StaffManagement from './pages/admin/StaffManagement.jsx';
import UserManagement from './pages/admin/UserManagement.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route element={<ProtectedRoute roles={['citizen']} />}>
              <Route path="complaints" element={<MyComplaints />} />
              <Route path="complaints/new" element={<CreateComplaint />} />
              <Route path="complaints/:id" element={<ComplaintDetails />} />
            </Route>
            <Route element={<ProtectedRoute roles={['staff']} />}>
              <Route path="staff/complaints" element={<AssignedComplaints />} />
              <Route path="staff/complaints/:id" element={<StaffComplaintDetails />} />
            </Route>
            <Route element={<ProtectedRoute roles={['admin']} />}>
              <Route path="admin/complaints" element={<AllComplaints />} />
              <Route path="admin/complaints/:id" element={<AdminComplaintDetails />} />
              <Route path="admin/staff" element={<StaffManagement />} />
              <Route path="admin/users" element={<UserManagement />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
