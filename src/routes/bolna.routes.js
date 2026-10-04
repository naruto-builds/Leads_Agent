import { Router } from 'express';
import { requireWebhookSecret } from '../middleware/auth.middleware.js';
import { postCallWebhook, highIntent } from '../controllers/bolna.controller.js';

const router = Router();

router.post('/webhook', requireWebhookSecret, postCallWebhook);
router.post('/tool/high-intent', requireWebhookSecret, highIntent);

export default router;