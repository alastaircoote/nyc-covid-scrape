import { addDays } from 'date-fns';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_MATCH = MONTHS.join('|');
const DATE_SUFFIX = '(?:th|st|nd)?';

const MULTILINE_SPLIT = new RegExp(
	`(${MONTHS_MATCH})((?:.+)[0-9]{1,2}) *[,;] *(${MONTHS_MATCH})?(.+)`
);

const EXTRACT_DATE_TEXT = new RegExp('Dates: *(.+)');

const EXTRACT_DATE_VALUES = new RegExp(
	`^(${MONTHS_MATCH}) +([0-9]{1,2})(?: *(?:–|-) *(${MONTHS_MATCH})? +([0-9]{1,2}))?$`
);

const EXTRACT_COMMA_SEPARATED_DATES = new RegExp(`^(${MONTHS_MATCH}) ((?:(?:[0-9]{1,2}),? *)+)$`);

/**
 *
 * @param {string} input
 * @returns {string}
 */
function normalizeMonthNames(input) {
	/** @type Record<string,string> */
	const months = {
		January: 'Jan',
		February: 'Feb',
		March: 'Mar',
		April: 'Apr',
		June: 'Jun',
		July: 'Jul',
		August: 'Aug',
		September: 'Sep',
		October: 'Oct',
		November: 'Nov',
		December: 'Dec'
	};

	return input.replace(new RegExp(Object.keys(months).join('|'), 'g'), function (longName) {
		if (!months[longName]) {
			throw new Error('Regex error');
		}
		return months[longName];
	});
}

/**
 *
 * @param {string} dateText
 * @param {import('./parse-site').ParsedSite} data
 * @returns {boolean}
 */
function parseDatesInner(dateText, data) {
	const isMultiLine = MULTILINE_SPLIT.exec(dateText);
	if (isMultiLine) {
		const firstSection = parseDatesInner(isMultiLine[1] + ' ' + isMultiLine[2], data);

		if (!isMultiLine[3]) {
			// there's no month specified in the second half so we need to borrow it
			return firstSection && parseDatesInner(isMultiLine[1] + ' ' + isMultiLine[4], data);
		} else {
			return firstSection && parseDatesInner(isMultiLine[3] + ' ' + isMultiLine[4], data);
		}
	}

	const dateValuesMatch = EXTRACT_DATE_VALUES.exec(dateText);
	if (dateValuesMatch && !dateValuesMatch[4]) {
		// It's just a single date
		const openDate = convertTextToDate(dateValuesMatch[1], dateValuesMatch[2]);
		if (!data.open) {
			data.open = [];
		}
		data.open.push(dateToStandardText(openDate));
		return true;
	}
	if (dateValuesMatch) {
		// It's a duration match
		if (!data.open) {
			data.open = [];
		}

		const startMonthName = dateValuesMatch[1];
		const startDateNumber = dateValuesMatch[2];
		let endMonthName = dateValuesMatch[3];
		if (!endMonthName) {
			// sometimes omitted, so we assume same as start
			endMonthName = startMonthName;
		}
		const endDateNumber = dateValuesMatch[4];

		let iterateDate = convertTextToDate(startMonthName, startDateNumber);
		const endDate = convertTextToDate(endMonthName, endDateNumber);
		while (iterateDate <= endDate) {
			data.open.push(dateToStandardText(iterateDate));
			iterateDate = addDays(iterateDate, 1);
		}
		return true;
	}

	const commaMatch = EXTRACT_COMMA_SEPARATED_DATES.exec(dateText);
	if (commaMatch) {
		const [_, monthName, commaSeparatedDates] = commaMatch;
		const dates = commaSeparatedDates.split(',').map((str) => str.trim());
		if (!data.open) {
			data.open = [];
		}
		for (const date of dates) {
			const parsed = convertTextToDate(monthName, date);
			data.open.push(dateToStandardText(parsed));
		}
		return true;
	}

	data.errors.push({
		type: 'could-not-parse-date',
		value: dateText
	});

	return false;
}

/**
 *
 * @param {string} text
 * @param {import('./parse-site').ParsedSite} data
 * @returns {boolean}
 */
export function parseDates(text, data) {
	const dateExtract = EXTRACT_DATE_TEXT.exec(text);
	if (!dateExtract) {
		return false;
	}
	const dateText = dateExtract[1];
	return parseDatesInner(dateText, data);
}

/**
 *
 * @param {string} month
 * @param {string} dayOfMonth
 * @returns
 */
function convertTextToDate(month, dayOfMonth) {
	const monthIndex = MONTHS.indexOf(month);
	const dayNumber = parseInt(dayOfMonth, 10);

	const rightNow = new Date();
	const year =
		monthIndex < rightNow.getMonth() ? rightNow.getFullYear() + 1 : rightNow.getFullYear();
	return new Date(year, monthIndex, dayNumber, 0, 0, 0);
}

/**
 *
 * @param {Date} date
 * @returns
 */
function dateToStandardText(date) {
	return [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-');
}
