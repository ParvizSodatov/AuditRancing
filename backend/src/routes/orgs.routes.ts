import { Router } from 'express';
import { orgsController } from '../controllers/orgs.controller.js';

const router = Router();

router.get('/', orgsController.list);
router.post('/', orgsController.create);
router.get('/:id', orgsController.getById);
router.put('/:id', orgsController.update);
router.delete('/:id', orgsController.remove);

export default router;
