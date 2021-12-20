const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const WEEKDAY_MATCH = WEEKDAYS.join('|');
const TIME = '[0-9]{1,2}(?::[0-9]{2})? ?[ap].m.?';

const MULTILINE_SPLIT = new RegExp(`^(.+?(?:${TIME})) *?((?:${WEEKDAY_MATCH})(?:.+?))$`);

const DAYS = new RegExp(`^(${WEEKDAY_MATCH})(?: – (${WEEKDAY_MATCH}))?`, 'g');
const TIME_MATCH = new RegExp(
	`([0-9]{1,2}(?::[0-9]{2})?) ?(a|p).m.? *– *([0-9]{1,2}(?::[0-9]{2})?) ?(a|p).m.?`,
	'g'
);

/**
 *
 * @param {string} time
 * @param {string} amOrPm
 * @returns
 */
function timeSegmentsToNumber(time, amOrPm) {
	const [hour, minutes] = time.split(':');
	let timeNumber = parseInt(hour, 10) * 100;
	if (amOrPm === 'p' && hour !== '12') {
		timeNumber += 1200;
	}
	if (minutes) {
		timeNumber += parseInt(minutes, 10);
	}
	return timeNumber;
}

/**
 *
 * @param {string} timeString
 * @param {import("./parse-site").ParsedSite} data
 * @returns {boolean}
 */
export function parseTime(timeString, data) {
	let times = {};
	// Sometimes multiple times are on one line. If so let's
	// make our life simpler by splitting it up:

	const multilineRegexResult = MULTILINE_SPLIT.exec(timeString);
	if (multilineRegexResult) {
		const [_, left, right] = multilineRegexResult;
		return parseTime(left, data) && parseTime(right, data);
	}

	const days = [];
	let dayMatch = DAYS.exec(timeString);
	if (!dayMatch) {
		// this isn't a time string, presumably
		return false;
	}
	while (dayMatch) {
		let currentDayIndex = WEEKDAYS.indexOf(dayMatch[1]);
		days.push(WEEKDAYS[currentDayIndex]);

		if (dayMatch[2]) {
			const endIndex = WEEKDAYS.indexOf(dayMatch[2]);
			currentDayIndex++;
			while (currentDayIndex <= endIndex) {
				days.push(WEEKDAYS[currentDayIndex]);
				currentDayIndex++;
			}
		}

		// console.log(dayMatch);
		// days.push([dayMatch[1], dayMatch[2]]);
		dayMatch = DAYS.exec(timeString);
	}

	const time = TIME_MATCH.exec(timeString);
	if (!time && timeString.toLowerCase().indexOf('closed') > -1) {
		return true;
	}
	if (!time) {
		return false;
	}

	if (TIME_MATCH.exec(timeString)) {
		throw new Error("Found two time strings, shouldn't happen");
	}
	for (const day of days) {
		if (data.hours[day.toLowerCase()]) {
			data.errors.push({
				type: 'hours-already-exist',
				value: 'Hours already exist for ' + day
			});
		} else {
			data.hours[day.toLowerCase()] = [
				timeSegmentsToNumber(time[1], time[2]),
				timeSegmentsToNumber(time[3], time[4])
			];
		}
	}

	return true;
}
