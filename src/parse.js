import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import * as fixes from './fixes.js';
import * as postFixes from './post-fixes.js';
import chalk from 'chalk';
import { parseSite } from './parse-site.js';
import { geocode } from './geocode.js';
import fs from 'fs/promises';
import { addWaitTimes } from './add_wait_times.js';

/**
 *
 * @param {Document} document
 */
function runFixes(document) {
	console.log(chalk.bold('Running fixes...'));

	for (const fixName of Object.keys(fixes)) {
		/** @type import('./fixes.js').Fixer */
		// @ts-ignore
		const fixer = fixes[fixName];
		const applied = fixer(document);

		const visual = applied ? chalk.green('✅') : chalk.red('❌');

		console.log(`${visual} ${fixName}`);
	}
}

/**
 *
 * @param {import('./parse-site.js').ParsedSite[]} sites
 * @param {Document} document
 */
function runPostFixes(sites, document) {
	console.log(chalk.bold('Running post-fixes...'));
	for (const fixName of Object.keys(postFixes)) {
		/** @type import('./post-fixes.js').PostFixer */
		// @ts-ignore
		const postFixer = postFixes[fixName];
		const applied = postFixer(sites, document);
		const visual = applied ? chalk.green('✅') : chalk.red('❌');

		console.log(`${visual} ${fixName}`);
	}
}

async function runScraper() {
	const res = await fetch(CHECK_URL);
	const html = await res.text();

	const dom = new JSDOM(html, {
		url: CHECK_URL
	});
	const { window } = dom;
	const { document, Node } = window;

	runFixes(document);

	const container = document.querySelector('#navbar.right-testing-side');

	if (!container) {
		throw new Error('Could not find container div');
	}
	let currentBorough = undefined;
	let currentTestSiteType = undefined;
	console.log(chalk.bold('\nChecking site listings...'));

	const sites = [];

	for (const child of Array.from(container.childNodes)) {
		if (child.nodeType === Node.TEXT_NODE) {
			if (!child.textContent || child.textContent.trim() === '') {
				continue;
			}
			throw new Error(`Unexpected text value: ${child.textContent.trim()}`);
		}
		if (child.nodeType !== Node.ELEMENT_NODE) {
			throw new Error(`Encountered unexpected node type: ${child}`);
		}

		const element = /**@type Element */ (child);

		if (element.tagName === 'H4') {
			currentBorough = parseBoroughNode(element);
			console.log('ℹ️  Set current borough to ' + currentBorough);

			continue;
		}

		if (element.tagName === 'H3') {
			if (!currentBorough) {
				throw new Error('Found test site header before borough header');
			}
			currentTestSiteType = parseTestSiteHeader(element, currentBorough);
			console.log('ℹ️  Set current test site type to ' + currentTestSiteType);
			continue;
		}

		if (element.tagName === 'DIV' && element.id === 'scheduleContainer') {
			// end of the list
			break;
		}

		if (element.tagName !== 'P' || element.classList.contains('m-b-20') === false) {
			throw new Error('Unexpected element:' + element.outerHTML);
		}

		if (!currentBorough || !currentTestSiteType) {
			throw new Error('Discovered test site element before headers for borough and site type');
		}

		const parsed = parseSite(element, window, currentBorough, currentTestSiteType);

		const geo = await geocode(parsed.address);

		const geoResult = geo.results[0];

		const acceptableGeocodeTypes = ['GEOMETRIC_CENTER', 'RANGE_INTERPOLATED', 'ROOFTOP'];

		if (acceptableGeocodeTypes.indexOf(geoResult.geometry.location_type) === -1) {
			parsed.errors.push({
				type: 'bad-geocode',
				value: parsed.address
			});
		} else {
			// @ts-ignore
			parsed.location = geoResult.geometry.location;
		}

		sites.push(parsed);
	}

	runPostFixes(sites, document);

	await addWaitTimes(sites);

	for (const site of sites) {
		if (site.offers.length === 0) {
			site.errors.push({
				type: 'no-offers',
				value: 'site has no offers'
			});
		}

		if (site.errors.length > 0) {
			console.log(chalk.bold('\nErrors encountered at ' + site.name));

			for (const error of site.errors) {
				console.log(`- ${error.type}: ${error.value}`);
			}
		}
	}

	const output = new URL('../output/sites.json', import.meta.url).pathname;
	await fs.writeFile(output, JSON.stringify(sites, null, 2));
}

const CHECK_URL = `https://www.nychealthandhospitals.org/covid-19-testing-sites/`;

/**
 *
 * @param {Element} h4Node
 */
function parseBoroughNode(h4Node) {
	const aTag = h4Node.querySelector('a');
	if (!aTag) {
		throw new Error('Element does not have an A tag');
	}

	/** @type Record<string,string> */
	const boroughs = {
		Bronx: 'bronx',
		Brooklyn: 'brooklyn',
		Manhattan: 'manhattan',
		Queens: 'queens',
		'Staten Island': 'staten-island'
	};

	const elementText = aTag.innerHTML.trim();
	if (!boroughs[elementText]) {
		throw new Error(`Expected a borough name, got ${elementText}`);
	}
	return boroughs[elementText];
}

/**
 *
 * @param {Element} h3Node
 * @param {string} boroughName
 */
function parseTestSiteHeader(h3Node, boroughName) {
	const regex = new RegExp(`${boroughName}-(.+)`);
	const regexResult = regex.exec(h3Node.getAttribute('id') || '');
	if (regexResult === null) {
		throw new Error('Could not parse ID ' + h3Node.getAttribute('id'));
	}

	const possibleSiteTypes = ['micro', 'mobile', 'mortar'];

	const siteType = regexResult[1];

	if (possibleSiteTypes.indexOf(siteType) === -1) {
		throw new Error(`Unrecognised site type: ${siteType}`);
	}

	return siteType;
}

runScraper();
