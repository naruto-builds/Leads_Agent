import { Router } from 'express';
import healthRoutes from './health.routes.js';
import callRoutes from './call.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/api', callRoutes);

export default router