/** @typedef {((site: import("./parse-site").ParsedSite[], doc: Document) => boolean)} PostFixer */

/** @type PostFixer */
export function coney_island_fixes(sites, doc) {
	const coney = sites.find((s) => s.name === 'NYC Health + Hospitals/Coney Island');

	if (!coney) {
		return false;
	}

	let found = false;

	const forNotes = [
		'Limited walk ins availability',
		'No walk-ins after 5 pm Mon – Fri and no walk-ins after 2pm on Saturdays'
	];

	coney.errors = coney.errors.filter((error) => {
		if (error.type === 'hours-already-exist') {
			return false;
		}
		if (error.type === 'could-not-parse' && error.value === 'Please schedule an appointment') {
			coney.appointments_required = true;
			return false;
		}
		if (error.type === 'could-not-parse' && forNotes.indexOf(error.value) > -1) {
			coney.notes.push(error.value);
			return false;
		}
		if (
			error.type === 'could-not-parse' &&
			error.value === '*Coney Island Hospital does not offer rapid testing.'
		) {
			found = true;
			return false;
		}
		return true;
	});
	return found;
}

/** @type PostFixer */
export function bellevue_walkin(sites, doc) {
	const coney = sites.find((s) => s.name === 'NYC Health + Hospitals/Bellevue');

	if (!coney) {
		return false;
	}

	let found = false;
	coney.errors = coney.errors.filter((error) => {
		if (
			error.type === 'could-not-parse' &&
			error.value === '*Walk-in hours maybe subject to change depending on patient volume.'
		) {
			found = true;
			return false;
		}
		return true;
	});
	return found;
}

/** @type PostFixer */
export function add_rapid_pcr_to_mobile(sites, doc) {
	const boroughs = ['bronx', 'brooklyn', 'manhattan', 'queens', 'staten-island'];

	let found = false;
	for (const borough of boroughs) {
		const h3 = doc.querySelector(`#${borough}-mobile`);
		if (!h3) {
			continue;
		}
		if (h3.innerHTML.indexOf('Rapid and PCR available') === -1) {
			continue;
		}
		found = true;
		sites
			.filter((site) => {
				return site.borough === borough && site.site_type === 'mobile';
			})
			.forEach((site) => {
				site.offers.push('rapid', 'pcr');
			});
	}
	return found;
}

/** @type PostFixer */
export function add_saliva_pcr_to_micro(sites, doc) {
	const boroughs = ['bronx', 'brooklyn', 'manhattan', 'queens', 'staten-island'];

	let found = false;
	for (const borough of boroughs) {
		const h3 = doc.querySelector(`#${borough}-micro`);
		if (!h3) {
			continue;
		}
		if (h3.innerHTML.indexOf('Saliva-based PCR') === -1) {
			continue;
		}
		found = true;
		sites
			.filter((site) => {
				return site.borough === borough && site.site_type === 'micro';
			})
			.forEach((site) => {
				site.offers.push('saliva-pcr');
			});
	}
	return found;
}

/** @type PostFixer */
export function add_pcr_to_mortar(sites, doc) {
	const boroughs = ['bronx', 'brooklyn', 'manhattan', 'queens', 'staten-island'];

	let found = false;
	for (const borough of boroughs) {
		sites
			.filter((site) => {
				return (
					site.borough === borough &&
					site.site_type === 'mortar' &&
					site.offers.indexOf('pcr') === -1
				);
			})
			.forEach((site) => {
				site.offers.push('pcr');
				found = true;
			});
	}
	return found;
}

/** @type PostFixer */
export function fix_woodside_name(sites) {
	const woodside = sites.find((s) => s.name === 'NYCHA Woodside Streetside Parking at');
	if (!woodside) {
		return false;
	}
	woodside.name = 'NYCHA Woodside Streetside Parking';
	return true;
}

/** @type PostFixer */
export function bellevue_christmas_message(sites) {
	const bellevue = sites.find((s) => s.name === 'NYC Health + Hospitals/Bellevue');
	if (!bellevue) {
		return false;
	}

	let found = false;
	bellevue.errors = bellevue.errors.filter((err) => {
		if (
			err.type === 'could-not-parse' &&
			err.value ===
				'Bellevue Testing will be closing at noon on Friday 12/24 and we will be CLOSED on Christmas Day 12/25'
		) {
			found = true;
			bellevue.closed = ['2021-12-25'];
			return false;
		}
		return true;
	});
	return found;
}

/** @type PostFixer */
export function elmhurst_appts_required(sites) {
	const elmhurst = sites.find((s) => s.name === 'NYC Health + Hospitals/Elmhurst');
	if (!elmhurst) {
		return false;
	}
	let found = false;
	elmhurst.errors = elmhurst.errors.filter((error) => {
		if (
			error.type === 'could-not-parse' &&
			error.value === 'Appointments are REQUIRED.  NO walk-ins at this time.'
		) {
			found = true;
			elmhurst.appointments_required = true;
			return false;
		}
		return true;
	});

	return found;
}

/** @type PostFixer */
export function belvis_nye_christmas_eve(sites) {
	const belvis = sites.find((s) => s.name === 'NYC Health + Hospitals/Gotham Health, Belvis');

	if (!belvis) {
		return false;
	}
	let found = false;

	belvis.errors = belvis.errors.filter((error) => {
		if (
			error.type === 'could-not-parse' &&
			error.value === 'Closed at 1:00 PM for Christmas Eve and New Year Eve'
		) {
			found = true;
			return false;
		}
		return true;
	});

	if (found) {
		const normalFridayHours = belvis.hours['friday'];
		if (!normalFridayHours) {
			throw new Error('Could not get Friday hours');
		}

		belvis.date_specific_hours['2021-12-24'] = [normalFridayHours[0], 1300];
		belvis.date_specific_hours['2021-12-31'] = [normalFridayHours[0], 1300];
	}
	return found;
}
