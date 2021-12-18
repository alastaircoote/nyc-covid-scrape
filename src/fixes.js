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
export function bronx_micro_header(doc) {
	const h3 = doc.querySelector('h3#bronx-micro');
	const element = h3?.nextElementSibling;
	if (!element || !element.parentNode) {
		return false;
	}

	if (element.className !== '') {
		return false;
	}

	if (element.innerHTML.trim() !== 'Micro-Sites: Saliva-based PCR') {
		return false;
	}
	element.parentNode.removeChild(element);
	h3.innerHTML = 'Micro-Sites: Saliva-based PCR';
	return true;
}

/** @type Fixer */
export function coney_island_merge(doc) {
	const link = doc.querySelector("a[href='/coneyisland']");
	if (!link) {
		return false;
	}

	const p = link.parentElement;
	const secondP = p?.nextElementSibling;
	if (!secondP || secondP.className !== '' || !secondP.parentNode) {
		return false;
	}
	p.innerHTML += secondP.innerHTML;
	// there's a duplication
	p.innerHTML = p.innerHTML.replace('Monday – Saturday, 8 a.m. – 4 p.m.', '');
	secondP.parentNode.removeChild(secondP);
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
