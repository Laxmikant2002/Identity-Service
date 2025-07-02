import { Router } from 'express';
import { IdentityController } from '../controllers/identityController';
import { validateIdentifyRequest } from '../middleware/validation';

const router = Router();
const identityController = new IdentityController();

router.post('/identify', validateIdentifyRequest, (req, res) => {
    identityController.identify(req, res);
});

export default router;