const advancedResults = (req, res, next) => {
	res.advancedResults = async (model, populate) => {
		let query;

		const reqQuery = req.query;

		// Fields to exclude
		const removeFields = ['select', 'sort', 'page', 'limit', 'exists'];

		// Loop over removeFields and delete them from reqQuery
		removeFields.forEach((param) => delete reqQuery[param]);

		// Check Existence
		if (req.query.exists) {
			const exists =
				req.query.exists.split(',').length > 0
					? req.query.exists.split(',')
					: [req.query.exists];
			exists.map((val) => {
				reqQuery[val] = { $exists: true, $nin: [null, undefined] };
			});
		}

		// Evaluate NOT Operator
		// if (req.query.not) {
		//   const not =
		//     req.query.not.split(',').length > 0
		//       ? req.query.not.split(',')
		//       : [req.query.not];
		//   reqQuery[not[0]] = { $not: { $regex: '^h.*' } };
		// }

		// Create query string
		let queryStr = JSON.stringify(reqQuery);

		// Create operators ($gt, $gte, etc)
		queryStr = queryStr.replace(
			/\b(gt|gte|lt|lte|in)\b/g,
			(match) => `$${match}`
		);

		// Finding resource
		query = model.find(JSON.parse(queryStr)).sort({ createdAt: -1 });

		// Select Fields
		if (req.query.select) {
			const fields = req.query.select.split(',').join(' ');
			query = query.select(fields);
		}

		// Sort
		if (req.query.sort) {
			const sortBy = req.query.sort.split(',').join(' ');
			query = query.sort(sortBy);
		} else {
			query = query.sort('-createdAt');
		}

		// Pagination
		const page = parseInt(req.query.page, 10) || 1;
		const limit = parseInt(req.query.limit, 10) || 25;
		const startIndex = (page - 1) * limit;
		const endIndex = page * limit;
		const total = await model.countDocuments();

		query = query.skip(startIndex).limit(limit);

		if (populate) {
			query = query.populate(populate);
		}

		// Executing query
		const results = await query;

		// Pagination result
		const pagination = { current: page, limit, total };

		if (endIndex < total) {
			pagination.next = {
				page: page + 1,
				limit,
				total,
			};
		}

		if (startIndex > 0) {
			pagination.prev = {
				page: page - 1,
				limit,
				total,
			};
		}

		return res.status(200).json({
			success: true,
			message: 'records retrieved',
			count: results.length,
			pagination,
			data: results,
		});
	};
	next();
};

export default advancedResults;
