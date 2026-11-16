// Gemeinsames Skript für alle Seiten:
// lädt Navigation, Notfallkarte und Footer nach und kümmert sich um kleine Effekte.
(function () {
	function load(id, url) {
		const el = document.getElementById(id);
		if (!el) return Promise.resolve(null);
		// 'no-cache': immer beim Server nachfragen, damit Änderungen sofort ankommen
		return fetch(url, { cache: 'no-cache' })
			.then(function (response) { return response.ok ? response.text() : ''; })
			.then(function (html) { el.innerHTML = html; return el; })
			.catch(function () { return null; });
	}

	load('my_footer', 'assets/footer.html');
	load('notfall-collapse', 'assets/notfallcard.html');

	load('my_navbar', 'assets/navbar.html').then(function (nav) {
		if (!nav) return;

		// aktuelle Seite in der Navigation hervorheben
		const page = location.pathname.split('/').pop() || 'index.html';
		nav.querySelectorAll('.nav-link[href]').forEach(function (link) {
			if (link.getAttribute('href').split('#')[0] === page) {
				link.classList.add('active');
				link.setAttribute('aria-current', 'page');
			}
		});
		if (page === 'leistungen.html') {
			const toggle = nav.querySelector('.dropdown-toggle');
			if (toggle) toggle.classList.add('active');
		}

		// Notfall-Button: auf dem Handy das Menü wieder einklappen
		const notfallBtn = nav.querySelector('#notfall-btn');
		const menu = nav.querySelector('#navbarNav');
		if (notfallBtn && menu) {
			notfallBtn.addEventListener('click', function () {
				if (menu.classList.contains('show') && window.bootstrap) {
					bootstrap.Collapse.getOrCreateInstance(menu).hide();
				}
			});
		}

		// navbar loads after the browser already jumped to #anchor, so scroll again
		const target = location.hash && document.getElementById(location.hash.slice(1));
		if (target) target.scrollIntoView({ behavior: 'instant' });
	});

	// Schatten unter der Navigation, sobald gescrollt wird
	const header = document.querySelector('.site-header');
	if (header) {
		const onScroll = function () {
			header.classList.toggle('is-scrolled', window.scrollY > 8);
		};
		window.addEventListener('scroll', onScroll, { passive: true });
		onScroll();
	}

	// Karten und Bildzeilen beim Scrollen sanft einblenden
	const items = document.querySelectorAll(
		'.feature-card, .info-card, .cta-band, .media-row, .vet-card, .job-card, .group-photo, .photo-carousel'
	);
	if ('IntersectionObserver' in window && items.length) {
		const observer = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				// sichtbar oder bereits überscrollt (z. B. nach Sprung zu einem Anker)
				if (!entry.isIntersecting && entry.boundingClientRect.top > 0) return;
				entry.target.classList.add('is-visible');
				observer.unobserve(entry.target);
			});
		}, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

		items.forEach(function (item) {
			// Karten in derselben Zeile leicht versetzt einblenden
			const column = item.parentElement;
			const row = column && column.parentElement;
			if (row && row.classList.contains('row')) {
				const index = Array.prototype.indexOf.call(row.children, column) % 4;
				item.style.setProperty('--reveal-delay', index * 0.08 + 's');
			}
			item.classList.add('reveal');
			observer.observe(item);
		});
	}
})();
