import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const ExampleModelSchema = mongoose.Schema(
	{
		username: {
			type: String,
			unique: true,
			// required: [true, 'Please add a user name'],
		},
		phone: {
			type: String,
			unique: true,
			// required: [true, 'Please add a phone number'],
		},
		email: {
			type: String,
			// required: [true, 'Please add an email'],
			unique: true,
			match: [
				/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
				'Please add a valid email',
			],
		},
		password: {
			type: String,
			// required: [true, 'Please add a password'],
			minlength: 6,
			select: false,
		},
		avatar: {
			type: String,
		},
	},
	{ timestamps: true }
);

//Encrypt password
ExampleModelSchema.pre('save', async function (next) {
	if (!this.isModified('password')) {
		next();
	}

	const salt = await bcrypt.genSalt(10);
	this.password = await bcrypt.hash(this.password, salt);
});

// Verify if password is valid
ExampleModelSchema.methods.validPassword = function (password) {
	return bcrypt.compareSync(password, this.local.password);
};

// Sign JWT and return
ExampleModelSchema.methods.getSignedJwtToken = function () {
	return jwt.sign(
		{ id: this._id, userType: this.userType },
		process.env.JWT_SECRET,
		{
			expiresIn: process.env.JWT_EXPIRE,
		}
	);
};

// Match User entered password to hashed password in database
ExampleModelSchema.methods.matchPassword = async function (enteredPassword) {
	return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
ExampleModelSchema.methods.getResetPasswordToken = function () {
	// Generate token
	const resetToken = crypto.randomBytes(20).toString('hex');

	// Hash token and set to resetPasswordToken field
	this.resetPasswordToken = crypto
		.createHash('sha256')
		.update(resetToken)
		.digest('hex');

	// Set expire
	this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

	return resetToken;
};

export default mongoose.model('ExampleModel', ExampleModelSchema);
