import { Router } from 'express';
import * as c from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validate.js';
import { validateObjectId } from '../middleware/validateObjectId.js';
import * as v from '../validators/workflowValidators.js';
import { ROLES } from '../utils/constants.js';

const router = Router();
router.use(protect, authorize(ROLES.ADMIN));

router.get('/dashboard', c.dashboard);
router.get('/complaints', validate(v.adminComplaintsQuerySchema, 'query'), c.complaints);
router.put('/complaints/:id/assign', validateObjectId(), validate(v.assignSchema), c.assign);
router.put('/complaints/:id/priority', validateObjectId(), validate(v.prioritySchema), c.priority);
router.put('/complaints/:id/verify', validateObjectId(), validate(v.verifySchema), c.verify);
router.put('/complaints/:id/reject', validateObjectId(), validate(v.rejectSchema), c.reject);

router.get('/users', validate(v.usersQuerySchema, 'query'), c.users);
router.post('/staff', validate(v.createStaffSchema), c.createStaff);
router.put('/users/:id/status', validateObjectId(), validate(v.userStatusSchema), c.setUserStatus);

export default router;
