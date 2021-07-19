import jwt from 'jsonwebtoken';
import asyncHandler from './async';
import ErrorResponse from '../utils/errorResponse.util';
import User from '../models/User';
import Admin from '../models/Admin';

// Protect routes
const protect = asyncHandler(async (req, res, next) => {
	let token;
	if (
		req.headers.authorization &&
		req.headers.authorization.startsWith('Bearer')
	) {
		// Set token from Bearer token in header
		token = req.headers.authorization.split(' ')[1];
		// Set token from cookie
	} else if (req.cookies.token) {
		token = req.cookies.token;
	}
	// Make sure token exists
	if (!token) {
		return next(new ErrorResponse('Not authorized to access this route', 401));
	}

	try {
		// Verify token
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		let user = await User.findById(decoded.id);
		req.user = user;
		next();
	} catch (err) {
		return next(new ErrorResponse('Not authorized to access this route', 401));
	}
});

// Grant access to only admins
const admin = asyncHandler(async (req, res, next) => {
	let token;
	if (
		req.headers.authorization &&
		req.headers.authorization.startsWith('Bearer')
	) {
		// Set token from Bearer token in header
		token = req.headers.authorization.split(' ')[1];
		// Set token from cookie
	}
	// else if (req.cookies.token) {
	//   token = req.cookies.token;
	// }
	// Make sure token exists
	if (!token) {
		return next(new ErrorResponse('Not authorized to access this route', 401));
	}

	try {
		// Verify token
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.admin = await Admin.findById(decoded.id);
		next();
	} catch (err) {
		return next(new ErrorResponse('Not authorized to access this route', 401));
	}
});

// Grant access to specific admin permissions
const authorizeAdmin = (...roles) => {
	return (req, res, next) => {
		if (req.admin.userType !== 'Admin') {
			return next(
				new ErrorResponse('Not authorized to access this route', 403)
			);
		}
		next();
	};
};

const authorize = (...roles) => {
	return (req, res, next) => {
		if (!roles.includes(req.user.role)) {
			return next(
				new ErrorResponse(
					`User role ${req.user.role} is not authorized to access this route`,
					403
				)
			);
		}
		next();
	};
};

export { protect, admin, authorize, authorizeAdmin };
