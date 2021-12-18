import fetch from 'node-fetch';

/** @type Record<string,string> */
const WAIT_TIME_MAPPINGS = {
	'57 Cleveland Place': 'Former St John Villa HS',
	'Bay Ridge 5th Avenue': 'Bay Ridge',
	'Bellevue Hospital': 'NYC Health + Hospitals/Bellevue',
	'Belvis DTC': 'NYC Health + Hospitals/Gotham Health, Belvis',
	'Bensonhurst 14th Avenue': 'Bensonhurst',
	// "CU Homecrest": "NR",
	'Coney Island Hospital': 'NYC Health + Hospitals/Coney Island',
	'Cumberland DTC': 'NYC Health + Hospitals/Gotham Health, Cumberland',
	'NYC Health + Hospitals/Gotham Health, East New York': '0-30',
	'Elmhurst Hospital': 'NYC Health + Hospitals/Elmhurst',
	'Fort Hamilton': '4002 Fort Hamilton',
	'Gouverneur Healthcare': 'NYC Health + Hospitals/Gotham Health, Gouverneur',
	'Greenbelt Recreation Center': 'Greenbelt Recreation Center',
	'Harlem Hospital Center': 'NYC Health + Hospitals/Harlem',
	'Jacobi Medical Center': 'NYC Health + Hospitals/Jacobi',
	'Kings County Hospital': 'NYC Health + Hospitals/Kings County',
	'Lincoln Medical Center': 'NYC Health + Hospitals/Lincoln',
	'Metropolitan Hospital': 'NYC Health + Hospitals/Metropolitan',
	Midwood: 'Midwood Pre-K',
	'Morrisania DTC': 'NYC Health + Hospitals/Gotham Health, Morrisania',
	'North Central Bronx Hospital': 'NYC Health + Hospitals/North Central Bronx',
	'Queens Hospital Center': 'NYC Health + Hospitals/Queens',
	'Sorreno Recreation Center': 'Sorrentino Rec Center',
	'St. George Ferry Terminal': 'Staten Island Ferry',
	'Starret City': 'Starrett City',
	'Sydenham Health Center': 'Gotham Health – Sydenham',
	'Times Square': 'Times Square Testing Site',
	'Tremont CHC': 'Christ Apostolic Church – Pediatric',
	Vanderbilt: 'NYC Health + Hospitals/Gotham Health, Vanderbilt',
	'Woodhull Medical Center': 'NYC Health + Hospitals/Woodhull',
	'Woodside Houses': 'NYCHA Woodside Streetside Parking'
};

/**
 *
 * @param {import("./parse-site").ParsedSite[]} sites
 */
export async function addWaitTimes(sites) {
	const res = await fetch(
		'https://raw.githubusercontent.com/afischer/nyc-covid-wait-times/main/data/latest.json'
	);
	const waitTimes = await /** @type {Promise<Record<string,string>>} */ (res.json());

	for (const name in waitTimes) {
		const mapping = WAIT_TIME_MAPPINGS[name];
		if (!mapping) {
			continue;
		}
		const site = sites.find((s) => s.name === mapping);
		if (!site) {
			throw new Error("Can't find mapping for " + mapping);
		}
		site.wait_time = waitTimes[name];
	}
}
