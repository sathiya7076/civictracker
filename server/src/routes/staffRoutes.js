import { Router } from 'express';
import { listMine, stats, updateStatus, uploadEvidence } from '../controllers/staffController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { imageUpload } from '../middleware/uploadMiddleware.js';
import { validate } from '../middleware/validate.js';
import { validateObjectId } from '../middleware/validateObjectId.js';
import { listQuerySchema } from '../validators/complaintValidators.js';
import { evidenceSchema, staffStatusSchema } from '../validators/workflowValidators.js';
import { ROLES } from '../utils/constants.js';

const router = Router();
router.use(protect, authorize(ROLES.STAFF));

router.get('/stats', stats);
router.get('/complaints', validate(listQuerySchema, 'query'), listMine);
router.put('/complaints/:id/status', validateObjectId(), validate(staffStatusSchema), updateStatus);
router.post('/complaints/:id/evidence', validateObjectId(), imageUpload('images'), validate(evidenceSchema), uploadEvidence);

export default router;
