import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { requireXhrHeader } from '../middleware/csrfMiddleware.js';
import { validate } from '../middleware/validate.js';
import { validateObjectId } from '../middleware/validateObjectId.js';
import { ROLES } from '../utils/constants.js';
import {
  createComplaintSchema,
  updateComplaintSchema,
  respondSchema,
  listQuerySchema,
} from '../validators/complaintValidators.js';
import {
  createComplaint,
  listComplaints,
  getComplaintById,
  updateComplaint,
  respondToComplaint,
} from '../controllers/complaintController.js';

const router = Router();

router.use(protect, requireXhrHeader);

// List: citizen sees own complaints, staff/admin sees all (decided in controller)
router.get('/', validate(listQuerySchema, 'query'), listComplaints);

// Citizen: raise + edit own
router.post('/', authorize(ROLES.CITIZEN), validate(createComplaintSchema), createComplaint);
router.patch(
  '/:id',
  authorize(ROLES.CITIZEN),
  validateObjectId('id'),
  validate(updateComplaintSchema),
  updateComplaint
);

// Staff: respond to the citizen
router.post(
  '/:id/responses',
  authorize(ROLES.STAFF, ROLES.ADMIN),
  validateObjectId('id'),
  validate(respondSchema),
  respondToComplaint
);

// Owner or staff (checked inside controller)
router.get('/:id', validateObjectId('id'), getComplaintById);

export default router;