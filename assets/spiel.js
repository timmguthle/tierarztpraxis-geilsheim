// Minispiel: Hund, Katze oder Pferd springen über das Praxisteam.
// Gezeichnet wird alles direkt auf ein <canvas>, es werden keine Bilder geladen.
(function () {
	'use strict';

	const stage = document.getElementById('game-stage');
	const canvas = document.getElementById('game-canvas');
	if (!stage || !canvas || !canvas.getContext) return;

	const ctx = canvas.getContext('2d');
	const overlay = document.getElementById('game-overlay');
	const overlayTitle = document.getElementById('game-overlay-title');
	const overlayText = document.getElementById('game-overlay-text');
	const scoreEl = document.getElementById('game-score');
	const bestEl = document.getElementById('game-best');
	const animalButtons = document.querySelectorAll('[data-animal]');

	// Das Spielfeld rechnet in festen Einheiten: immer 300 hoch,
	// die Breite ergibt sich aus dem Bildschirm (Handy schmal, PC breit).
	const H = 300;
	const GROUND = 252;
	const GRAVITY = 2200;
	const START_SPEED = 260;
	let W = 600;
	let pixel = 1;

	const INK = '#2b2620';

	/* ---------------------------------------------------------------- Speicher */

	function load(key, fallback) {
		try {
			const value = localStorage.getItem(key);
			return value === null ? fallback : value;
		} catch (e) {
			return fallback;
		}
	}

	function save(key, value) {
		try {
			localStorage.setItem(key, value);
		} catch (e) { /* z. B. privater Modus: dann eben ohne Rekord */ }
	}

	/* ------------------------------------------------------------ Zeichenhilfen */

	function circle(x, y, r) {
		ctx.beginPath();
		ctx.arc(x, y, r, 0, Math.PI * 2);
		ctx.fill();
	}

	function ellipse(x, y, rx, ry, rotation) {
		ctx.beginPath();
		ctx.ellipse(x, y, rx, ry, rotation || 0, 0, Math.PI * 2);
		ctx.fill();
	}

	function roundRect(x, y, w, h, r) {
		ctx.beginPath();
		ctx.moveTo(x + r, y);
		ctx.arcTo(x + w, y, x + w, y + h, r);
		ctx.arcTo(x + w, y + h, x, y + h, r);
		ctx.arcTo(x, y + h, x, y, r);
		ctx.arcTo(x, y, x + w, y, r);
		ctx.closePath();
	}

	function line(x1, y1, x2, y2, width, color) {
		ctx.strokeStyle = color;
		ctx.lineWidth = width;
		ctx.lineCap = 'round';
		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.stroke();
	}

	// Beine: schwingen beim Laufen, im Sprung nach vorn und hinten gestreckt.
	// hips: [x, y, Versatz im Laufrhythmus, Richtung im Sprung]
	function legs(hips, length, width, color, phase, inAir) {
		hips.forEach(function (hip) {
			const angle = inAir ? hip[3] * 0.8 : Math.sin(phase + hip[2]) * 0.65;
			line(hip[0], hip[1], hip[0] + Math.sin(angle) * length, hip[1] + Math.cos(angle) * length, width, color);
		});
	}

	/* -------------------------------------------------------------------- Tiere */
	// Nullpunkt ist jeweils unten links, das Tier schaut nach rechts.

	function drawDog(a, phase, inAir) {
		legs([[17, -20, 0, -1], [43, -20, Math.PI, 1]], 20, 5.5, a.dark, phase, inAir);
		// Rute, wedelt
		ctx.strokeStyle = a.color;
		ctx.lineWidth = 5;
		ctx.lineCap = 'round';
		ctx.beginPath();
		ctx.moveTo(10, -30);
		ctx.quadraticCurveTo(3, -36, 4 + Math.sin(phase * 2) * 2.5, -46);
		ctx.stroke();

		ctx.fillStyle = a.color;
		ellipse(29, -29, 21, 10);
		line(44, -32, 50, -40, 13, a.color);
		ctx.fillStyle = a.color;
		circle(51, -42, 8.5);
		roundRect(54, -43.5, 12, 8, 3.5);
		ctx.fill();
		// Schlappohr, Nase, Auge
		ctx.fillStyle = a.dark;
		ellipse(46.5, -40, 3.6, 8, 0.3);
		ctx.fillStyle = INK;
		circle(66, -41.5, 2);
		ctx.fillStyle = '#fdfcf8';
		circle(54, -44.5, 1.5);

		legs([[20, -20, Math.PI, -1], [46, -20, 0, 1]], 20, 5.5, a.color, phase, inAir);
	}

	function drawCat(a, phase, inAir) {
		legs([[15, -15, 0, -1], [37, -15, Math.PI, 1]], 15, 4.5, a.dark, phase, inAir);
		// Schwanz
		ctx.strokeStyle = a.color;
		ctx.lineWidth = 4.5;
		ctx.lineCap = 'round';
		ctx.beginPath();
		ctx.moveTo(9, -22);
		ctx.bezierCurveTo(0, -26, 7, -38, 2 + Math.sin(phase) * 2, -46);
		ctx.stroke();

		ctx.fillStyle = a.color;
		ellipse(25, -22, 18, 8.5);
		line(38, -25, 44, -31, 10, a.color);
		ctx.fillStyle = a.color;
		circle(46, -33, 8);
		// Ohren
		ctx.beginPath();
		ctx.moveTo(40, -38);
		ctx.lineTo(41.5, -47);
		ctx.lineTo(47, -40);
		ctx.moveTo(46, -40);
		ctx.lineTo(51.5, -47);
		ctx.lineTo(53, -37);
		ctx.fill();
		// Auge, Nase
		ctx.fillStyle = '#fdfcf8';
		circle(49, -34.5, 1.5);
		ctx.fillStyle = '#d98f8a';
		circle(53.6, -31.5, 1.2);

		legs([[18, -15, Math.PI, -1], [40, -15, 0, 1]], 15, 4.5, a.color, phase, inAir);
	}

	function drawHorse(a, phase, inAir) {
		legs([[21, -30, 0, -1], [52, -30, Math.PI, 1]], 30, 5, a.dark, phase, inAir);
		// Schweif
		ctx.strokeStyle = a.dark;
		ctx.lineWidth = 7;
		ctx.lineCap = 'round';
		ctx.beginPath();
		ctx.moveTo(13, -44);
		ctx.quadraticCurveTo(1, -40, 4 + Math.sin(phase) * 3, -20);
		ctx.stroke();

		// Mähne (hinter dem Hals), Rumpf, Hals, Kopf
		line(51, -51, 61, -67, 6, a.dark);
		ctx.fillStyle = a.color;
		ellipse(36, -40, 25, 12);
		line(54, -44, 64, -60, 14, a.color);
		line(64, -62, 76, -54, 10, a.color);
		// Ohr, Auge, Nüster
		ctx.fillStyle = a.color;
		ctx.beginPath();
		ctx.moveTo(61, -66);
		ctx.lineTo(64, -75);
		ctx.lineTo(67.5, -66);
		ctx.fill();
		ctx.fillStyle = '#fdfcf8';
		circle(68, -61.5, 1.5);
		ctx.fillStyle = a.dark;
		circle(78, -53, 1.3);

		legs([[24, -30, Math.PI, -1], [55, -30, 0, 1]], 30, 5, a.color, phase, inAir);
	}

	// box: Trefferfläche (etwas kleiner als das Bild, damit es fair bleibt)
	const ANIMALS = {
		hund: { color: '#943330', dark: '#722725', w: 68, box: { x: 12, w: 42, h: 40 }, jump: 760, draw: drawDog },
		katze: { color: '#8a8c8b', dark: '#6b6d6c', w: 56, box: { x: 10, w: 36, h: 32 }, jump: 760, draw: drawCat },
		pferd: { color: '#4b3f30', dark: '#33291e', w: 82, box: { x: 14, w: 52, h: 54 }, jump: 800, draw: drawHorse }
	};

	/* ---------------------------------------------------------------- Tierärzte */

	const VETS = [
		// weißer Kittel, Stethoskop, Spritze
		{ h: 76, coat: '#ffffff', outline: '#c9c2b2', long: true, trousers: '#4f5b6b', skin: '#f0c9a5', hair: '#3b2f25', style: 'short', item: 'syringe', stetho: true },
		// roter Kasack, Pferdeschwanz, Klemmbrett
		{ h: 66, coat: '#943330', trousers: '#943330', skin: '#f3d2b3', hair: '#d9b36a', style: 'pony', item: 'clipboard' },
		// blauer Kasack, Dutt, Halskragen
		{ h: 70, coat: '#2f3e5c', trousers: '#2f3e5c', skin: '#e0ac82', hair: '#5a3a22', style: 'bun', item: 'cone', stetho: true },
		// grüner Kasack, grauer Bart, Brille, Fieberthermometer
		{ h: 80, coat: '#6b7a45', trousers: '#4b3f30', skin: '#f0c9a5', hair: '#b4b4ae', style: 'beard', item: 'thermo', glasses: true },
		// Azubi mit Leckerli
		{ h: 60, coat: '#2f3e5c', trousers: '#2f3e5c', skin: '#c98d62', hair: '#221a14', style: 'short', item: 'treat' }
	];

	function drawItem(item, x, y) {
		if (item === 'syringe') {
			line(x - 10, y - 1, x - 17, y - 1, 1, '#7d8790');
			ctx.fillStyle = '#cfe3ee';
			ctx.strokeStyle = '#7d8790';
			ctx.lineWidth = 1;
			roundRect(x - 10, y - 3, 10, 4.5, 1);
			ctx.fill();
			ctx.stroke();
			line(x + 1, y - 3.5, x + 1, y + 2, 1.6, '#7d8790');
		} else if (item === 'clipboard') {
			ctx.fillStyle = '#a8612f';
			roundRect(x - 8, y - 12, 10, 14, 1.5);
			ctx.fill();
			ctx.fillStyle = '#fff';
			ctx.fillRect(x - 6.5, y - 9.5, 7, 10);
			line(x - 5, y - 7, x - 1, y - 7, 0.9, '#b9b2a2');
			line(x - 5, y - 4.5, x - 1, y - 4.5, 0.9, '#b9b2a2');
		} else if (item === 'cone') {
			ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
			ctx.strokeStyle = '#b9b2a2';
			ctx.lineWidth = 1.2;
			ctx.beginPath();
			ctx.moveTo(x - 14, y - 10);
			ctx.lineTo(x - 3, y - 4);
			ctx.lineTo(x - 3, y + 4);
			ctx.lineTo(x - 14, y + 10);
			ctx.closePath();
			ctx.fill();
			ctx.stroke();
		} else if (item === 'thermo') {
			line(x + 1, y + 1, x - 11, y - 6, 2.6, '#e4e4e0');
			ctx.fillStyle = '#c0392b';
			circle(x - 11.5, y - 6.3, 1.7);
		} else if (item === 'treat') {
			ctx.fillStyle = '#e2c084';
			circle(x - 9, y - 2.5, 2);
			circle(x - 9, y + 0.5, 2);
			circle(x - 2.5, y - 2.5, 2);
			circle(x - 2.5, y + 0.5, 2);
			ctx.fillRect(x - 9, y - 2.5, 6.5, 3);
		}
	}

	// Nullpunkt: Mitte der Füße auf dem Boden, die Person schaut nach links.
	function drawVet(x, d, wobble) {
		const h = d.h;
		const headR = 9;
		const headY = -h + headR;
		const torsoTop = -h + headR * 2 - 1;
		const legH = Math.round(h * 0.38);
		const torsoBottom = d.long ? -legH + 13 : -legH + 3;
		const edge = d.outline || null;

		ctx.save();
		ctx.translate(x, GROUND);

		ctx.fillStyle = 'rgba(43, 38, 32, 0.12)';
		ellipse(-1, 1, 15, 3.2);

		// Beine und Schuhe
		ctx.fillStyle = d.trousers;
		ctx.fillRect(-7, -legH, 6, legH - 2);
		ctx.fillRect(1, -legH, 6, legH - 2);
		ctx.fillStyle = INK;
		roundRect(-10.5, -4, 9.5, 4, 2);
		ctx.fill();
		roundRect(-2.5, -4, 9.5, 4, 2);
		ctx.fill();

		// hinterer Arm
		if (edge) line(6, torsoTop + 7, 9, torsoTop + 25, 6.4, edge);
		line(6, torsoTop + 7, 9, torsoTop + 25, 5, d.coat);

		// Kittel oder Kasack
		ctx.fillStyle = d.coat;
		roundRect(-10, torsoTop, 20, torsoBottom - torsoTop, 6);
		ctx.fill();
		if (edge) {
			ctx.strokeStyle = edge;
			ctx.lineWidth = 1.2;
			ctx.stroke();
			line(-1, torsoTop + 8, -1, torsoBottom - 2, 1, edge);
		}

		if (d.stetho) {
			ctx.strokeStyle = INK;
			ctx.lineWidth = 1.6;
			ctx.beginPath();
			ctx.moveTo(-5.5, torsoTop + 1);
			ctx.quadraticCurveTo(-1, torsoTop + 17, 4.5, torsoTop + 1);
			ctx.stroke();
			ctx.fillStyle = '#8b8f96';
			circle(-1, torsoTop + 11, 2.3);
		}

		// Kopf: erst Haare, dann Gesicht davor
		ctx.fillStyle = d.hair;
		circle(1.5, headY - 1, headR + 0.6);
		if (d.style === 'pony') line(8, headY - 2, 15, headY + 9, 4.5, d.hair);
		if (d.style === 'bun') circle(8.5, headY - 8, 4.2);
		ctx.fillStyle = d.skin;
		circle(-1.5, headY + 1.5, headR - 1.6);
		if (d.style === 'beard') {
			ctx.fillStyle = d.hair;
			ctx.beginPath();
			ctx.arc(-1.5, headY + 1.5, headR - 1.4, Math.PI * 0.2, Math.PI * 0.95);
			ctx.closePath();
			ctx.fill();
		}
		ctx.fillStyle = INK;
		circle(-5, headY + 0.5, 1.1);
		if (d.glasses) {
			ctx.strokeStyle = INK;
			ctx.lineWidth = 0.9;
			ctx.beginPath();
			ctx.arc(-5, headY + 0.5, 2.8, 0, Math.PI * 2);
			ctx.moveTo(-2.2, headY + 0.3);
			ctx.lineTo(4, headY - 0.5);
			ctx.stroke();
		} else if (d.style !== 'beard') {
			ctx.strokeStyle = INK;
			ctx.lineWidth = 0.9;
			ctx.beginPath();
			ctx.arc(-4.5, headY + 3.2, 2.2, Math.PI * 0.15, Math.PI * 0.8);
			ctx.stroke();
		}

		// vorderer Arm mit dem, was die Person gerade in der Hand hat
		const handX = -19;
		const handY = torsoTop + 16 + wobble;
		if (edge) line(-6, torsoTop + 7, handX, handY, 6.4, edge);
		line(-6, torsoTop + 7, handX, handY, 5, d.coat);
		drawItem(d.item, handX, handY);
		ctx.fillStyle = d.skin;
		circle(handX, handY, 2.6);

		ctx.restore();
	}

	/* --------------------------------------------------------------- Spielstand */

	let state = 'ready';        // 'ready' | 'running' | 'over'
	let animalKey = ANIMALS[load('tpg-spiel-tier', '')] ? load('tpg-spiel-tier', '') : 'hund';
	let best = parseInt(load('tpg-spiel-rekord', '0'), 10) || 0;
	let time = 0;               // Sekunden seit Seitenaufruf
	let scroll = 0;             // wie weit die Landschaft schon gelaufen ist
	let run = 0;                // gelaufene Strecke in dieser Runde
	let speed = START_SPEED;
	let score = 0;
	let shownScore = -1;
	let y = 0;                  // Höhe des Tiers über dem Boden
	let vy = 0;
	let wantJump = -1;          // Zeitpunkt des letzten Tippens
	let overAt = 0;
	let nextGap = 0;
	let obstacles = [];

	function animalX() {
		return Math.max(22, W * 0.09);
	}

	function maxSpeed() {
		return Math.max(380, Math.min(540, W * 0.95));
	}

	function setOverlay(title, text) {
		if (!overlay) return;
		if (title === null) {
			overlay.hidden = true;
			return;
		}
		overlayTitle.textContent = title;
		overlayText.textContent = text;
		overlay.hidden = false;
	}

	function showScore() {
		if (score === shownScore) return;
		shownScore = score;
		if (scoreEl) scoreEl.textContent = score;
		if (bestEl) bestEl.textContent = Math.max(best, score);
	}

	function setAnimal(key) {
		if (!ANIMALS[key]) return;
		animalKey = key;
		save('tpg-spiel-tier', key);
		animalButtons.forEach(function (button) {
			button.setAttribute('aria-pressed', button.getAttribute('data-animal') === key ? 'true' : 'false');
		});
	}

	function start() {
		state = 'running';
		run = 0;
		score = 0;
		speed = START_SPEED;
		y = 0;
		vy = 0;
		obstacles = [];
		nextGap = W * 0.9;
		setOverlay(null);
		showScore();
	}

	function gameOver() {
		state = 'over';
		overAt = time;
		const record = score > best;
		if (record) {
			best = score;
			save('tpg-spiel-rekord', String(best));
		}
		showScore();
		setOverlay(record ? 'Neuer Rekord!' : 'Erwischt!', score + ' Punkte – tippen für eine neue Runde');
		if (navigator.vibrate) {
			try { navigator.vibrate(60); } catch (e) { /* nicht wichtig */ }
		}
	}

	function spawn() {
		const pick = function () { return VETS[Math.floor(Math.random() * VETS.length)]; };
		const pair = score > 120 && Math.random() < 0.28;
		const vets = pair ? [{ dx: 12, d: pick() }, { dx: 38, d: pick() }] : [{ dx: 13, d: pick() }];
		obstacles.push({
			x: W + 30,
			w: pair ? 50 : 26,
			h: Math.max.apply(null, vets.map(function (v) { return v.d.h; })),
			vets: vets,
			seed: Math.random() * 6
		});
		// Abstand so, dass nach der Landung immer Zeit für den nächsten Sprung bleibt
		nextGap = speed * (0.95 + Math.random() * 0.9) + (pair ? 50 : 26);
	}

	function hits(obstacle) {
		const a = ANIMALS[animalKey];
		const left = animalX() + a.box.x;
		const right = left + a.box.w;
		const bottom = GROUND - y;
		const top = bottom - a.box.h;
		// Arm und Kopf zählen nicht mit: nur der Körper
		return right > obstacle.x + 4 && left < obstacle.x + obstacle.w - 4 &&
			bottom > GROUND - obstacle.h + 7 && top < GROUND;
	}

	function update(dt) {
		time += dt;
		if (state === 'over') return;

		if (state === 'ready') {
			scroll += 90 * dt;
			return;
		}

		speed = Math.min(maxSpeed(), speed + 5 * dt);
		const step = speed * dt;
		scroll += step;
		run += step;
		score = Math.floor(run / 12);

		// springen (ein Tippen kurz vor der Landung zählt noch)
		if (y === 0 && time - wantJump < 0.12) {
			vy = ANIMALS[animalKey].jump;
			wantJump = -1;
		}
		if (y > 0 || vy > 0) {
			vy -= GRAVITY * dt;
			y += vy * dt;
			if (y <= 0) {
				y = 0;
				vy = 0;
			}
		}

		nextGap -= step;
		if (nextGap <= 0) spawn();
		for (let i = obstacles.length - 1; i >= 0; i--) {
			obstacles[i].x -= step;
			if (obstacles[i].x + obstacles[i].w < -40) obstacles.splice(i, 1);
		}
		for (let i = 0; i < obstacles.length; i++) {
			if (hits(obstacles[i])) {
				gameOver();
				break;
			}
		}
		showScore();
	}

	/* ------------------------------------------------------------------ Zeichnen */

	function hill(color, base, amp, length, offset) {
		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.moveTo(0, H);
		for (let x = 0; x <= W + 12; x += 12) {
			const p = (x + offset) / length * Math.PI * 2;
			ctx.lineTo(x, base - amp * (0.5 + 0.5 * Math.sin(p)) - amp * 0.3 * Math.sin(p * 2.7));
		}
		ctx.lineTo(W + 12, H);
		ctx.fill();
	}

	// feste "Zufallszahl" zwischen 0 und 1 für eine Stelle im Gelände
	function noise(n) {
		const s = Math.sin(n * 127.1) * 43758.5453;
		return s - Math.floor(s);
	}

	function drawBackground() {
		const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
		sky.addColorStop(0, '#e6eeec');
		sky.addColorStop(1, '#fbf9f2');
		ctx.fillStyle = sky;
		ctx.fillRect(0, 0, W, H);

		ctx.fillStyle = '#f7e2b8';
		circle(W - 54, 52, 22);

		// Wolken
		ctx.fillStyle = '#ffffff';
		const span = W + 200;
		for (let i = 0; i < 3; i++) {
			const x = (((i * span / 3 + 60 - scroll * 0.06) % span) + span) % span - 100;
			const cy = 44 + i * 26;
			ellipse(x, cy, 26, 9);
			ellipse(x + 16, cy - 7, 16, 9);
			ellipse(x - 14, cy - 5, 13, 7);
		}

		hill('#eaecd6', 214, 34, 520, scroll * 0.12);
		hill('#dedfbd', 232, 20, 300, scroll * 0.25 + 90);

		// Boden
		ctx.fillStyle = '#efe9d6';
		ctx.fillRect(0, GROUND, W, H - GROUND);
		line(0, GROUND, W, GROUND, 2, '#cbc4ab');

		// Grasbüschel und Blumen laufen mit
		for (let wx = Math.floor(scroll / 64) * 64 - 64; wx < scroll + W + 64; wx += 64) {
			const r = noise(wx);
			const x = wx - scroll + r * 40;
			if (r < 0.55) {
				line(x, GROUND, x - 3, GROUND - 6, 1.6, '#8d8741');
				line(x + 2, GROUND, x + 2, GROUND - 8, 1.6, '#8d8741');
				line(x + 4, GROUND, x + 8, GROUND - 5, 1.6, '#8d8741');
			} else if (r < 0.7) {
				line(x, GROUND, x, GROUND - 9, 1.4, '#8d8741');
				ctx.fillStyle = r < 0.62 ? '#dc986a' : '#ffffff';
				circle(x, GROUND - 10, 2.6);
			} else {
				ctx.fillStyle = '#d9d2bc';
				ellipse(x, GROUND + 12 + r * 14, 5, 1.6);
			}
		}
	}

	function render() {
		ctx.setTransform(pixel, 0, 0, pixel, 0, 0);
		drawBackground();

		obstacles.forEach(function (o) {
			o.vets.forEach(function (v, i) {
				drawVet(o.x + v.dx, v.d, Math.sin(time * 3 + o.seed + i) * 1.5);
			});
		});

		const a = ANIMALS[animalKey];
		const x = animalX();
		// Schatten wird im Sprung kleiner
		const shrink = Math.max(0.45, 1 - y / 220);
		ctx.fillStyle = 'rgba(43, 38, 32, 0.13)';
		ellipse(x + a.w * 0.45, GROUND + 1.5, a.w * 0.38 * shrink, 3.5 * shrink);

		ctx.save();
		ctx.translate(x, GROUND - y);
		// im Sprung leicht nach oben bzw. unten geneigt
		if (y > 0) {
			ctx.translate(a.w / 2, -a.box.h / 2);
			ctx.rotate(Math.max(-0.22, Math.min(0.22, -vy / 3600)));
			ctx.translate(-a.w / 2, a.box.h / 2);
		}
		a.draw(a, scroll / 11, y > 0);
		ctx.restore();
	}

	/* ------------------------------------------------------------------- Eingabe */

	function press() {
		if (state === 'ready') {
			start();
			wantJump = time;
		} else if (state === 'over') {
			// kurze Pause, damit ein hektisches Tippen nicht sofort neu startet
			if (time - overAt > 0.45) start();
		} else {
			wantJump = time;
		}
	}

	stage.addEventListener('pointerdown', function (event) {
		if (event.pointerType === 'mouse' && event.button !== 0) return;
		event.preventDefault();
		press();
	});
	stage.addEventListener('contextmenu', function (event) { event.preventDefault(); });

	document.addEventListener('keydown', function (event) {
		if (event.code !== 'Space' && event.code !== 'ArrowUp') return;
		// Leertaste auf einem Knopf oder Link soll diesen bedienen, nicht springen
		const tag = event.target && event.target.tagName;
		if (tag === 'BUTTON' || tag === 'A' || tag === 'INPUT' || tag === 'TEXTAREA') return;
		event.preventDefault();
		if (!event.repeat) press();
	});

	animalButtons.forEach(function (button) {
		button.addEventListener('click', function () {
			setAnimal(button.getAttribute('data-animal'));
		});
	});

	/* -------------------------------------------------------------- Größe, Start */

	function resize() {
		const width = stage.clientWidth;
		const height = stage.clientHeight;
		if (!width || !height) return;
		const dpr = Math.min(window.devicePixelRatio || 1, 3);
		canvas.width = Math.round(width * dpr);
		canvas.height = Math.round(height * dpr);
		const scale = height / H;
		W = width / scale;
		pixel = dpr * scale;
	}

	if ('ResizeObserver' in window) {
		new ResizeObserver(resize).observe(stage);
	}
	window.addEventListener('resize', resize);
	resize();

	let last = 0;
	function frame(now) {
		// höchstens 1/30 s pro Bild rechnen, z. B. nach einem Tab-Wechsel
		const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 0;
		last = now;
		update(dt);
		render();
		requestAnimationFrame(frame);
	}

	setAnimal(animalKey);
	showScore();
	setOverlay('Bereit?', 'Tippen, klicken oder Leertaste drücken');
	render();
	requestAnimationFrame(frame);
})();
