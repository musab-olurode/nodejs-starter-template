import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
	const transporter = nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		port: process.env.SMTP_PORT,
		secure: false,
		auth: {
			user: process.env.SMTP_EMAIL,
			pass: process.env.SMTP_PASSWORD,
		},
		tls: {
			rejectUnauthorized: false,
		},
	});

	const message = {
		from: `${options.fromName ? options.fromName : process.env.FROM_NAME} <${
			options.fromEmail ? options.fromEmail : process.env.FROM_EMAIL
		}>`,
		to: options.email,
		subject: options.subject,
		text: options.message,
		html: options.html ? options.html : null,
	};

	await transporter.sendMail(message);
};

export default sendEmail;
