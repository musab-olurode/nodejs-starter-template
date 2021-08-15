import asyncHandler from '../middlewares/async';
import { successResponse } from '../helpers/response';

const hello = asyncHandler(async (req, res, next) => {
	await req.validate({
		email: 'required|email',
		username: 'required|string',
	});

	successResponse(res, 'success', {});
});

export { hello };
