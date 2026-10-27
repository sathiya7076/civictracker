import { Router } from 'express';
import { create, getOne, getUpdates, listMine, remove, update } from '../controllers/complaintController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { imageUpload } from '../middleware/uploadMiddleware.js';
import { validate } from '../middleware/validate.js';
import { validateObjectId } from '../middleware/validateObjectId.js';
import { createComplaintSchema, listQuerySchema, updateComplaintSchema } from '../validators/complaintValidators.js';
import { ROLES } from '../utils/constants.js';

const router = Router();
router.use(protect);

// Order matters: '/my' must be registered before '/:id'.
router.post('/', authorize(ROLES.CITIZEN), imageUpload('images'), validate(createComplaintSchema), create);
router.get('/my', authorize(ROLES.CITIZEN), validate(listQuerySchema, 'query'), listMine);

// Access to a single complaint is decided in complaintService.getAccessibleComplaint.
router.get('/:id', validateObjectId(), getOne);
router.get('/:id/updates', validateObjectId(), getUpdates);
router.put('/:id', authorize(ROLES.CITIZEN), validateObjectId(), validate(updateComplaintSchema), update);
router.delete('/:id', authorize(ROLES.CITIZEN), validateObjectId(), remove);

export default router;
