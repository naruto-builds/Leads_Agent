import { Router } from 'express';
import healthRoutes from './health.routes.js';
import callRoutes from './call.routes.js';
import bolnaRoutes from './bolna.routes.js';
import whatsappRoutes from './whatsapp.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/api', callRoutes);
router.use('/bolna', bolnaRoutes);
router.use('/whatsapp', whatsappRoutes);

export default router