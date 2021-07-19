import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { errorHandler, routeErrorHandler } from './app/middleware/error';
import colors from 'colors';
import connectDB from './app/config/db';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fileupload from 'express-fileupload';

// Load env vars
dotenv.config();

// Route files
import exampleRoute from './routes/example.route';

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
app.use(express.static('public', new URL('../public', import.meta.url)));

// Mount routers
app.use('/v1/hello', exampleRoute);

const PORT = process.env.PORT || 7500;

const server = app.listen(PORT, () => {
	console.log(
		`
                                            ============= Server running in ${process.env.NODE_ENV} mode on port ${PORT} ==============
    `.yellow.bold
	);
});

app.use(errorHandler);
app.use(routeErrorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
	console.log(`Error: ${err.message}`.red);
	// Close server & exit process
	server.close(() => process.exit(1));
});
