import { Router } from 'express';
import { requireWebhookSecret, requireToolSecret } from '../middleware/auth.middleware.js';
import { postCallWebhook, highIntent, toolAck } from '../controllers/bolna.controller.js';

const router = Router();

router.post('/webhook', requireWebhookSecret, postCallWebhook);
router.post('/tool/high-intent', requireToolSecret, highIntent);
router.post('/tool/ack', requireWebhookSecret, toolAck);

export default router;