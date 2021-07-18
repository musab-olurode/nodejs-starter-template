const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const errorHandler = require('./middleware/error');
const colors = require('colors');
const connectDB = require('./config/db');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const fileupload = require('express-fileupload');
const path = require('path');

// Load env vars
dotenv.config({ path: './.env' });

// Route files
// const auth = require('./routes/auth.route');

// Connect to database
connectDB();

// Initialize Express
const app = express();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Enable Cors
app.use(cors());

// Dev logging  middleware
if (process.env.NODE_ENV === 'development') {
	app.use(morgan('dev'));
}

// File Upload
app.use(fileupload());

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Mount routers
// app.use("/v1/auth", auth);

const PORT = process.env.PORT || 7500;

const server = app.listen(PORT, () => {
	console.log(
		`
                                            ============= Server running in ${process.env.NODE_ENV} mode on port ${PORT} ==============
    `.yellow.bold
	);
});

app.use(errorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
	console.log(`Error: ${err.message}`.red);
	// Close server & exit process
	server.close(() => process.exit(1));
});
