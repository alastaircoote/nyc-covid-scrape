/** @typedef {((site: import("./parse-site").ParsedSite[], doc: Document) => boolean)} PostFixer */

/** @type PostFixer */
export function coney_island_no_rapid(sites, doc) {
	const coney = sites.find((s) => s.name === 'NYC Health + Hospitals/Coney Island');

	if (!coney) {
		return false;
	}

	let found = false;
	coney.errors = coney.errors.filter((error) => {
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
