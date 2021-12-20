import fetch from 'node-fetch';
import fs from 'fs/promises';

const STORED_GEOCODE_PATH = new URL('../saved_geocodes.json', import.meta.url).pathname;

/** @typedef {google.maps.GeocoderResult} GeocoderResult */

/** @type Promise<Record<string,{results: GeocoderResult[]}>> */
const ALREADY_CACHED = (async function () {
	const source = await fs.readFile(STORED_GEOCODE_PATH, 'utf-8');
	return JSON.parse(source);
})();

/**
 *
 * @param {string} address
 * @returns {Promise<{results: GeocoderResult[]}>}
 */
export async function geocode(address) {
	const cache = await ALREADY_CACHED;

	if (cache[address]) {
		return cache[address];
	}

	const { GEOCODE_KEY } = process.env;
	if (!GEOCODE_KEY) {
		throw new Error('No geocode key');
	}

	console.log('Sending geocode request for ' + address.split('\n')[0]);
	const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
	url.searchParams.append('key', GEOCODE_KEY);
	url.searchParams.append('address', address);

	const res = await fetch(url.href);
	if (!res.ok) {
		throw new Error('Geocode request failed');
	}
	const json = await /** @type Promise<{results: GeocoderResult[]}> */ (res.json());
	const cached = await fs.readFile(STORED_GEOCODE_PATH, 'utf-8');
	/** @type Record<string,{results: GeocoderResult[]}> */
	const cachedJSON = JSON.parse(cached);
	cachedJSON[address] = json;
	await fs.writeFile(STORED_GEOCODE_PATH, JSON.stringify(cachedJSON, null, 2));
	return json;
}
