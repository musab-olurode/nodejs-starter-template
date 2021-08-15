import Validator from 'validatorjs';
import { errorResponse } from '../helpers/response';
import mongoose from 'mongoose';

const registerCustomRules = () => {
	Validator.registerAsync(
		'exists',
		// eslint-disable-next-line no-unused-vars
		async (value, requirement, attribute, passes) => {
			if (!requirement) {
				return passes(false, 'exists requirements are expected');
			}
			const requirements = requirement.split(',');
			if (requirements.length !== 2) {
				return passes(false, 'exists requirements must be exactly 2');
			}
			const modelName = requirements[0];
			const modelField = requirements[1];
			const formattedModelName =
				modelName.charAt(0).toUpperCase() + modelName.slice(1);
			const Model = mongoose.connection.model(formattedModelName);
			const foundModel = await Model.findOne({ [modelField]: value });
			if (!foundModel) {
				return passes(false, `the ${attribute} does not exist`);
			}
			return passes();
		}
	);
	Validator.register(
		'file',
		// eslint-disable-next-line no-unused-vars
		(value, requirement, attribute) => {
			console.log(value);
			if (!value.isFile) {
				return false;
			}
			return true;
		},
		'the :attribute is not a file'
	);
};

registerCustomRules();

const validator = async (body, rules, customMessages, callback) => {
	const validation = new Validator(body, rules, customMessages);
	validation.passes(() => callback(null, true));
	validation.fails(() => callback(validation.errors, false));
	validation.checkAsync(
		() => callback(null, true),
		() => callback(validation.errors, false)
	);
};

const validate = (req, res, next) => {
	req.validate = async (rules, customMessages = {}) => {
		// eslint-disable-next-line no-unused-vars
		return await new Promise((resolve, reject) => {
			validator(
				{ ...req.params, ...req.query, ...req.body, ...req.files },
				rules,
				customMessages,
				(err, status) => {
					if (!status) {
						return errorResponse(
							next,
							convertValidationErrorsToString(err),
							422
						);
					}
					resolve();
				}
			);
		});
	};
	next();
};

const convertValidationErrorsToString = (err) => {
	let errorString = '';
	let errors = [];

	// eslint-disable-next-line no-unused-vars
	Object.entries(err.errors).forEach(([key, value]) => {
		errors = errors.concat(value);
	});
	errors.forEach((errorValue) => {
		let errorValueWithoutPeriod = errorValue.split('.')[0];
		if (errors.indexOf(errorValue) != errors.length - 1) {
			errorValueWithoutPeriod += ', ';
		}
		errorString += errorValueWithoutPeriod;
	});

	return errorString;
};

export default validate;
