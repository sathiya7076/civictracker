import { Router } from 'express';
import { createComplaint, getOne, getUpdates, listMine, remove, update } from '../controllers/complaintController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { imageUpload } from '../middleware/uploadMiddleware.js';
import { validate } from '../middleware/validate.js';
import { validateObjectId } from '../middleware/validateObjectId.js';
import { createComplaintSchema, listQuerySchema, updateComplaintSchema } from '../validators/complaintValidators.js';
import { ROLES } from '../utils/constants.js';

const router = Router();
router.use(protect);

// Citizen. Multer must run before validate() so multipart text fields are parsed into req.body.
router.post('/', authorize(ROLES.CITIZEN), imageUpload('images'), validate(createComplaintSchema), createComplaint);
router.get('/my', authorize(ROLES.CITIZEN), validate(listQuerySchema, 'query'), listMine); // keep above '/:id'
router.put('/:id', authorize(ROLES.CITIZEN), validateObjectId(), validate(updateComplaintSchema), update);
router.delete('/:id', authorize(ROLES.CITIZEN), validateObjectId(), remove);

// Owner citizen, assigned staff or admin (ownership is enforced in complaintService.getAccessibleComplaint).
router.get('/:id', validateObjectId(), getOne);
router.get('/:id/updates', validateObjectId(), getUpdates);

export default router;