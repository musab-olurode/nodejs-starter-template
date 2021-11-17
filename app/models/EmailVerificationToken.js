import mongoose from 'mongoose';
import crypto from 'crypto';

const EmailVerificationTokenSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.ObjectId,
			ref: 'User',
			required: true,
		},
		token: {
			type: String,
		},
		expires: Date,
	},
	{ timestamps: true }
);

// Generate and hash token
EmailVerificationTokenSchema.methods.getVerificationToken = function () {
	// Generate token
	const verificationToken = crypto.randomBytes(20).toString('hex');

	// Hash token and set to verificationToken field
	this.token = crypto
		.createHash('sha256')
		.update(verificationToken)
		.digest('hex');

	// set expire=y date
	this.expires = Date.now() + 10 * 60 * 1000;

	this.save();

	return verificationToken;
};

const EmailVerificationTokenModel = mongoose.model(
	'EmailVerificationToken',
	EmailVerificationTokenSchema
);

export default EmailVerificationTokenModel;
