import express from 'express';
import { hello } from '../app/controllers/exampleController';
// import { protect } from '../app/middleware/auth';

const exampleRoute = express.Router({ mergeParams: true });

exampleRoute.route('/').get(hello);

export default exampleRoute;
