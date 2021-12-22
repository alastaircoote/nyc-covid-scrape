/** @typedef {(document: Document) => boolean} Fixer */

/** @type Fixer */
export function fix_manhattan_test_site_types(doc) {
	let foundAny = false;
	const h3s = doc.querySelectorAll('h3');
	h3s.forEach((h3) => {
		const id = h3.getAttribute('id');
		if (!id) {
			return;
		}
		if (!id.startsWith('manhanttan-')) {
			return;
		}

		h3.setAttribute('id', id.replace('manhanttan-', 'manhattan-'));
		foundAny = true;
	});
	return foundAny;
}

/** @type Fixer */
export function remove_top_button(doc) {
	const element = doc.querySelector('a.topbutton');
	if (!element || !element.parentNode?.parentNode) {
		return false;
	}
	element.parentNode.parentNode.removeChild(element.parentNode);
	return true;
}

/** @type Fixer */
export function co_op_city_date_typo(doc) {
	const bronxHeader = doc.querySelector('#bronx-mobile');
	if (!bronxHeader) {
		return false;
	}
	let check = bronxHeader.nextElementSibling;
	while (check) {
		if (check.innerHTML.indexOf('Wedenesday') > -1) {
			check.innerHTML = check.innerHTML.replace('Wedenesday', 'Wednesday');
			return true;
		}
		check = check.nextElementSibling;
	}
	return false;
}

/** @type Fixer */
export function queens_museum_repeat_address(doc) {
	const queensHeader = doc.querySelector('#queens-micro');
	if (!queensHeader) {
		return false;
	}
	let check = queensHeader.nextElementSibling;
	while (check) {
		if (check.innerHTML.indexOf('Queens Museum New York City Building') > -1) {
			check.innerHTML = 'Queens Museum New York City Building<br>' + check.innerHTML;
			return true;
		}
		check = check.nextElementSibling;
	}
	return false;
}

/** @type Fixer */
export function remove_rotating_metadata(doc) {
	// There's a banner that changes every hour and a comment at the end of the page about
	// the last time the page was created. We want to ignore those otherwise we're going to
	// reparse every time we scrape.

	const icon = doc.querySelector('link[rel=icon]');

	if (!icon) {
		return false;
	}
	const style = icon.nextElementSibling;
	const script = style?.nextElementSibling;
	if (!style || style.tagName !== 'STYLE' || !script || script.tagName !== 'SCRIPT') {
		return false;
	}
	style.parentElement?.removeChild(style);
	script.parentElement?.removeChild(script);

	const html = doc.querySelector('html');
	while (html?.nextSibling) {
		html?.nextSibling.parentNode?.removeChild(html?.nextSibling);
	}

	return true;
}
