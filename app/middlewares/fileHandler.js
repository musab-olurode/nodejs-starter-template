const fileHandler = (req, res, next) => {
	if (req.files) {
		// eslint-disable-next-line no-unused-vars
		Object.entries(req.files).forEach(([key, file]) => {
			file.isFile = true;
		});
		// req.body = { ...req.body, ...req.files };
	}
	next();
};

export default fileHandler;
