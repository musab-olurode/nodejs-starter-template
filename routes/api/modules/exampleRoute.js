import express from 'express';
import { hello } from '../../../app/controllers/exampleController';
// import { protect } from '../app/middleware/auth';

const router = express.Router();

router.route('/').post(hello);

export default router;
