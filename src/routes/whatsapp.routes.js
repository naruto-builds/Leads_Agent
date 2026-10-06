import { Router } from 'express';
import { verifyMetaSignature } from '../middleware/metaSignature.middleware.js';
import { verifyWebhook, receiveWebhook } from '../controllers/whatsapp.controller.js';

const router = Router();

router.get('/webhook', verifyWebhook);
router.post('/webhook', verifyMetaSignature, receiveWebhook);

export default router;