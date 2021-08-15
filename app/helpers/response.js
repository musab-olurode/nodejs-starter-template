import ErrorResponse from './errorResponse';

const successResponse = (res, message, data, code = 200) => {
	return res.status(code).json({ success: true, message, data });
};

const errorResponse = (next, error, code) => {
	return next(new ErrorResponse(error, code));
};

export { successResponse, errorResponse };
