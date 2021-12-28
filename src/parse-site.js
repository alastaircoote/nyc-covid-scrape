import { parseDates } from './parse-dates.js';
import { parseTime } from './parse-times.js';

/** @typedef ParseError
 * @property {string} type
 * @property {string} value
 */

/** @typedef ParsedSite
 * @property {string} name
 * @property {string | undefined} link
 * @property {string} address
 * @property {string} borough
 * @property {string} site_type
 * @property {string | undefined} phone
 * @property {number} minimum_age
 * @property {string[]} offers
 * @property {Record<string,number[]>} hours
 * @property {Record<string,number[]>} date_specific_hours
 * @property {ParseError[]} errors
 * @property {string | undefined} pre_register_link
 * @property {{lat:number, lng:number} | undefined} location
 * @property {string} wait_time
 * @property {string[]} open
 * @property {string[]} closed
 * @property {string[]} notes
 * @property {boolean} appointments_required;
 */

/**
 *
 * @param {Element} pTag
 * @param {import('jsdom').DOMWindow} window
 * @param {string} borough
 * @param {string} siteType
 */
export function parseSite(pTag, window, borough, siteType) {
	const { Element, Text } = window;
	const elements = Array.from(pTag.childNodes).filter((child) => {
		return (
			(child instanceof Element && child.tagName !== 'BR') ||
			(child instanceof Text && child.textContent && child.textContent.trim() !== '')
		);
	});

	/** @type ParsedSite */
	let data = {
		name: '',
		link: undefined,
		address: '',
		borough,
		site_type: siteType,
		hours: {},
		errors: [],
		minimum_age: 2,
		phone: undefined,
		offers: [],
		pre_register_link: undefined,
		location: undefined,
		wait_time: 'unknown',
		open: [],
		closed: [],
		notes: [],
		appointments_required: false,
		date_specific_hours: {}
	};

	const firstElement = elements.shift();
	if (!firstElement) {
		data.errors?.push({
			type: 'no-text',
			value: 'no text to parse'
		});
		return data;
	}

	// Name always comes first so let's parse that before anything else
	parseName(firstElement, window, data);

	// Address actually consumes multiple lines from the elements array
	// so we need to run this before the rest of our parsers too.
	parseAddress(elements, window, data);

	for (const line of elements) {
		let parsed = false;

		if (line instanceof Element && line.tagName === 'A') {
			if (parseLink(line, data) === false) {
				data.errors.push({
					type: 'unrecognised-element',
					value: line.outerHTML
				});
			}
			continue;
		}

		if (
			(line instanceof Element && line.tagName !== 'SPAN' && line.tagName !== 'STRONG') ||
			(line instanceof Text === false && line instanceof Element === false)
		) {
			throw new Error('Unexpected element:' + line);
		}

		let textContent = '';
		if (line instanceof Element) {
			if (line.tagName !== 'SPAN' && line.tagName !== 'STRONG') {
				data.errors?.push({
					type: 'unrecognised-element',
					value: line.outerHTML
				});
				continue;
			}
			textContent = line.innerHTML.trim();
		} else if (line instanceof Text && line.textContent) {
			textContent = line.textContent.trim();
		}

		if (textContent === '' || textContent === '\u200B') {
			continue;
		}
		parsed =
			parseTime(textContent, data) ||
			parseDates(textContent, data) ||
			parseMetadata(textContent, data);

		if (!parsed) {
			data.errors?.push({
				type: 'could-not-parse',
				value: textContent
			});
		}
	}

	return data;
}

/**
 *
 * @param {Element} link
 * @param {ParsedSite} data
 * @returns
 */
function parseLink(link, data) {
	if (link.getAttribute('href') === '#scheduleContainer') {
		const visitId = link.getAttribute('data-visitid');
		const resId = link.getAttribute('data-resid');
		const deptId = link.getAttribute('data-deptId');

		if (!visitId || !resId || !deptId) {
			data.errors.push({
				type: 'parse-link-failed',
				value: link.outerHTML
			});
			return false;
		}

		data.pre_register_link = `https://epicscheduling.nychhc.org/MyChart/SignupAndSchedule/EmbeddedSchedule?id=RES,${resId}&dept=${deptId}&vt=${visitId}`;
		return true;
	}
	return false;
}

/**
 *
 * @param {string} text
 * @param {ParsedSite} data
 * @returns {boolean}
 */
function parseMetadata(text, data) {
	if (/^[0-9]{3}-[0-9]{3}-[0-9]{4}$/.test(text) || text === '844-NYC-4NYC') {
		data.phone = text;
		return true;
	}
	if (text === '4 years old and above') {
		data.minimum_age = 4;
		return true;
	}
	if (text === 'COVID-19 Testing and Antibody Testing Offered Here') {
		data.offers.push('pcr', 'antibody');
		return true;
	}
	if (text === 'Rapid Molecular Testing Available Here') {
		data.offers.push('rapid-molecular');
		return true;
	}
	if (text === 'Rapid Antigen Testing Available Here') {
		data.offers.push('rapid-antigen');
		return true;
	}

	if (text === 'PCR Testing Available Here') {
		data.offers.push('pcr');
		return true;
	}

	const junkText = ['Appointments:', 'General Information:', '7 days a week'];

	if (junkText.indexOf(text) > -1) {
		return true;
	}

	return false;
}

/**
 *
 * @param {ChildNode} nameTag
 * @param {import('jsdom').DOMWindow} window
 * @param {Partial<ParsedSite>} data
 * @returns {boolean}
 */
function parseName(nameTag, { Node, location, Text, Element, document }, data) {
	if (data.name) {
		return false;
	}
	if (nameTag instanceof Text && nameTag.textContent) {
		data.name = nameTag.textContent.trim();
	}
	if (nameTag instanceof Element && nameTag.tagName === 'A') {
		data.name = nameTag.innerHTML.trim();
		const href = nameTag.getAttribute('href');
		if (!href) {
			data.errors?.push({
				type: 'name-missing-link',
				value: nameTag.outerHTML
			});
			return true;
		}
		data.link = new URL(href, location.href).href;

		function checkForBlueInstruction() {
			// This is all very dumb but we're changing the minimum age of a site if it has a link because
			// the page says any site listed in "blue text" (i.e. is a link) can test children under 2.
			// but before we do that we should make sure the page still describes this logic otherwise
			// we're going to mislead people. If that logic has changed then it's significant enough that
			// we should stop parsing and wait for a code change.

			const inBlueSpan = document.querySelector("span[style='color: #337ab7;']");
			if (inBlueSpan?.innerHTML !== 'in blue') {
				return false;
			}
			const parentParagraph = inBlueSpan?.parentElement;
			const firstChild = parentParagraph?.firstChild;
			if (!firstChild) {
				return false;
			}
			if (!(firstChild instanceof Text)) {
				return false;
			}
			if (
				firstChild.textContent !==
				'Children who are 2 years of age or older can be tested at any of the sites listed below. Children younger than 2 years of age can be tested at any of the sites listed '
			) {
				return false;
			}
			return true;
		}

		if (checkForBlueInstruction() === false) {
			// let's just make sure the page still outlines the logic we're using in code
			data.errors?.push({
				type: 'age-info-missing',
				value: ''
			});
		} else {
			data.minimum_age = 0;
		}
		return true;
	}
	return false;
}

/**
 *
 * @param {ChildNode[]} elements
 * @param {import('jsdom').DOMWindow} window
 * @param {Partial<ParsedSite>} data
 * @returns {boolean}
 */
function parseAddress(elements, { Text }, data) {
	const zipRegex = /(NY|New York|Bronx|Brooklyn|Manhattan|Queens),? [0-9]{5}/;

	const addressLines = [];
	while (elements.length > 0) {
		const nextElement = elements.shift();
		if (!nextElement) {
			data.errors?.push({
				type: 'address-parse-failed',
				value: 'ran out of lines'
			});
			return false;
		}
		if (nextElement instanceof Text && nextElement.textContent) {
			const nextLine = nextElement.textContent.trim();
			addressLines.push(nextLine);
			if (zipRegex.test(nextLine)) {
				break;
			}
		}
	}
	if (elements.length === 0) {
		throw new Error('Could not find ZIP line in ' + addressLines.join('\n'));
	}

	data.address = addressLines.join('\n');

	if (addressLines.length === 1) {
		// there are some places where the name is actually an important part of the
		// address, otherwise we're just trying to geocode "New York NY [zip]". So let's
		// add the name.
		data.address = data.name + '\n' + data.address;
	}

	return true;
}
