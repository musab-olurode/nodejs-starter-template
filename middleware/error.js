const ErrorResponse = require('../utils/errorResponse.util');
const winston = require('winston');

const files = new winston.transports.File({ filename: 'debug.log' });
winston.add(files);

const errorHandler = (err, req, res, next) => {
	let error = { ...err };

	error.message = err.message;

	// Log to console for dev
	console.log(err.stack.red);

	// Mongoose bad ObjectId
	if (err.name === 'CastError') {
		const message = 'Resource not found';
		error = new ErrorResponse(message, 404);
	}

	// Mongoose duplicate key
	if (err.code === 11000) {
		const message = `The ${Object.entries(err.keyValue)[0][0]} ${
			Object.entries(err.keyValue)[0][1]
		} has already been used, please try something else.`;
		error = new ErrorResponse(message, 400);
	}

	// Mongoose validation error
	if (err.name === 'ValidationError') {
		const message = Object.values(err.errors).map((val) => val.message);
		error = new ErrorResponse(message, 400);
	}

	winston.info(err.stack);

	if (process.env.NODE_ENV === 'development') {
		res.status(error.statusCode || 500).json({
			success: false,
			error: error.message || 'Server Error',
		});
	} else {
		// Syntax error
		if (err.name === 'TypeError') {
			const message = 'A server Error has occured';
			error = new ErrorResponse(message, 404);
		}

		if (error.statusCode !== 500) {
			res.status(error.statusCode || 500).json({
				success: false,
				error: error.message || 'Server Error',
			});
		} else {
			res.status(500).json({
				success: false,
				error: 'A Server Error has occured.',
			});
		}
	}
};

module.exports = errorHandler;
