import { Router } from 'express';
import { requireCallSecret } from '../middleware/auth.middleware.js';
import { startCall } from '../controllers/call.controller.js';

const router = Router();

router.post('/call', requireCallSecret, startCall);

export default router;