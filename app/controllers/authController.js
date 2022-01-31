import { createHash } from 'crypto';
import asyncHandler from '../middlewares/async';
import sendEmail from '../../configs/mailer';
import EmailVerificationToken from '../models/EmailVerificationToken';
import { errorResponse, successResponse } from '../helpers/response';

//models
import User from '../models/User';

// eslint-disable-next-line no-unused-vars
export const signup = asyncHandler(async (req, res, next) => {
	await req.validate({
		email: 'required|string|email|unique:user,email',
		phone: 'required|string|unique:user,phone',
		password: 'required|string|confirmed|min:6',
	});

	const { email, password, phone } = req.body;

	const user = await User.create({ email, password, phone });

	let token = await EmailVerificationToken.create({ user: user._id });

	await token.save();

	sendTokenResponse(res, user, 201);
});

export const signin = asyncHandler(async (req, res, next) => {
	await req.validate({
		email: 'required|string|email',
		password: 'required|string|min:6',
	});

	const { email, password } = req.body;
	let user;

	// Check for user
	const userCheck = await User.findOne({ email }).select('+password');

	if (!userCheck) {
		return errorResponse(next, 'Invalid credentials', 401);
	}

	// Check if password matches
	const isMatch = await userCheck.matchPassword(password);

	if (!isMatch) {
		return errorResponse(next, 'Invalid credentials', 401);
	} else {
		user = await User.findOne({ email });
	}

	sendTokenResponse(res, user);
});

// eslint-disable-next-line no-unused-vars
export const logout = asyncHandler(async (req, res, next) => {
	res.cookie('token', 'none', {
		expires: new Date(Date.now() + 10 * 1000),
		httpOnly: true,
	});

	successResponse(res, '', {});
});

// eslint-disable-next-line no-unused-vars
export const getAuthUser = asyncHandler(async (req, res, next) => {
	const user = await User.findById(req.user._id);

	successResponse(res, '', { user });
});

// eslint-disable-next-line no-unused-vars
export const updateDetails = asyncHandler(async (req, res, next) => {
	await req.validate({
		email: 'required|string|email',
		username: 'required|string',
	});

	const fieldsToUpdate = {
		name: req.body.name,
		email: req.body.email,
	};

	const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
		new: true,
		runValidators: true,
	});

	successResponse(res, '', { user });
});

export const updatePassword = asyncHandler(async (req, res, next) => {
	await req.validate({
		currentPassword: 'required|string|min:6',
		newPassword: 'required|string|min:6|confirmed',
	});

	const user = await User.findById(req.user._id).select('+password');

	// Check current password
	if (!(await user.matchPassword(req.body.currentPassword))) {
		return errorResponse(next, 'Password is incorrect', 401);
	}

	user.password = req.body.newPassword;
	await user.save();

	sendTokenResponse(res, user);
});

export const forgotPassword = asyncHandler(async (req, res, next) => {
	await req.validate({
		email: 'required|email',
	});

	const user = await User.findOne({ email: req.body.email });

	if (!user) {
		return errorResponse(next, 'There is no user with that email', 404);
	}

	// Get reset token
	const resetToken = user.getResetPasswordToken();

	await user.save({ validateBeforeSave: false });

	// Create reset url
	const resetUrl = `${req.protocol}://${req.get('host')}/v1/auth/reset-password/${resetToken}`;

	const message = `You are receiving this email because you requested the reset of a password. Please click on this link to continue: \n\n ${resetUrl}`;

	try {
		await sendEmail({
			email: user.email,
			subject: 'Password reset token',
			message,
		});

		successResponse(res, '', { success: true, data: 'Email sent' });
	} catch (err) {
		user.resetPasswordToken = undefined;
		user.resetPasswordExpire = undefined;

		await user.save({ validateBeforeSave: false });

		return errorResponse(next, 'Email could not be sent', 500);
	}

	successResponse(res, '', { user });
});

export const resetPassword = asyncHandler(async (req, res, next) => {
	await req.validate({
		password: 'required|string|confirmed',
		resettoken: 'required|string',
	});
	// Get hashed token
	const resetPasswordToken = createHash('sha256').update(req.params.resettoken).digest('hex');

	const user = await User.findOne({
		resetPasswordToken,
		resetPasswordExpire: { $gt: Date.now() },
	});

	if (!user) {
		return errorResponse(next, 'Invalid token', 400);
	}

	// Set new password
	user.password = req.body.password;
	user.resetPasswordToken = undefined;
	user.resetPasswordExpire = undefined;
	await user.save();

	sendTokenResponse(res, user);
});

export const getEmailVerificationToken = asyncHandler(async (req, res, next) => {
	const user = await User.findById(req.user.id);

	if (user.verified) {
		return errorResponse(next, 'User verified already', 400);
	}

	const token = await EmailVerificationToken.findOne({ user: user._id });

	const newToken = token.getVerificationToken();

	await token.save();

	const message = `Verify your email using the following link \n 
                     ${process.env.FRONTEND_URL}/verify-email/${newToken}`;

	await sendEmail({
		email: user.email,
		subject: `Email Confirmation, ${process.env.APP_NAME}`,
		message,
	});

	successResponse(res, 'Email verification sent, check your email inbox', {}, 200);
});

export const verifyEmail = asyncHandler(async (req, res, next) => {
	req.validate({
		token: 'required|string',
	});
	const emailToken = req.params.token;

	// Get hashed token
	const verificationToken = createHash('sha256').update(emailToken).digest('hex');

	const token = await EmailVerificationToken.findOne({
		token: verificationToken,
		expires: { $gt: Date.now() },
	});

	if (!token) {
		return errorResponse(next, 'Invalid token', 400);
	}

	// update user verification status
	const user = await User.findById(token.user);

	user.verified = true;

	await user.save();

	// remove token from document
	token.token = undefined;
	token.expires = undefined;

	await token.save();

	successResponse(res, 'Email verification is successful', {}, 200);
});

// Get token from model, create cookie and send response
const sendTokenResponse = (res, user, statusCode = 200) => {
	const token = user.getSignedJwtToken();

	const options = {
		expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
		httpOnly: true,
	};

	if (process.env.NODE_ENV === 'production') {
		options.secure = true;
	}

	user = user.toObject({
		// eslint-disable-next-line no-unused-vars
		transform: (doc, ret, options) => {
			if (ret.password) delete ret.password;
			return ret;
		},
	});

	res.status(statusCode).cookie('token', token, options).json({
		success: true,
		data: { user },
		token,
	});
};
