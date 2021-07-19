import asyncHandler from '../middleware/async';

const hello = asyncHandler(async (req, res, next) => {
	res.status(200).json({ success: true, data: 'Hello World' });
});

export { hello };
