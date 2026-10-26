export interface ManagerOgPlayer {
	name: string;
	position: string;
	seasonPoints?: number | null;
	isCaptain?: boolean;
	isViceCaptain?: boolean;
}

export interface ManagerOgTheme {
	canvas: string;
	highlight: string;
	ink: string;
	paper: string;
	kit: string;
	kitLight: string;
}

const themes: ManagerOgTheme[] = [
	{ canvas: '#a6d9fa', highlight: '#dcefff', ink: '#102748', paper: '#f1f8ff', kit: '#174eb1', kitLight: '#5289ed' },
	{ canvas: '#ecdccb', highlight: '#fff5e6', ink: '#431827', paper: '#fff6eb', kit: '#831e3e', kitLight: '#c15670' },
	{ canvas: '#d7c5f6', highlight: '#f2eaff', ink: '#2b1746', paper: '#faf4ff', kit: '#6033a6', kitLight: '#a479e6' },
	{ canvas: '#b9dfd3', highlight: '#e6f8ed', ink: '#123b32', paper: '#f1fff7', kit: '#185a49', kitLight: '#4c9c77' },
	{ canvas: '#f3b6a0', highlight: '#ffe9d7', ink: '#45231e', paper: '#fff5eb', kit: '#883f31', kitLight: '#c97758' },
	{ canvas: '#ffc632', highlight: '#ffe991', ink: '#202221', paper: '#fff9e9', kit: '#262c30', kitLight: '#5c666c' },
];

// A manager keeps their palette when their team name, captain or gameweek changes.
export function getManagerOgTheme(managerId: string | number): ManagerOgTheme {
	const id = String(managerId);
	const seed = /^\d+$/.test(id) ? Number(id) : [...id].reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0, 0);
	return themes[Math.abs(seed) % themes.length]!;
}

type Point = { x: number; y: number };

// A pinhole camera looking at the centre of a 68 × 105 metre field. Project
// every point in 3D, including elevated goalposts and the player verticals.
// Unlike a skewed trapezoid, this keeps straight lines straight and gives
// parallel pitch markings the same vanishing points.
// Match the approved crop: a shallow sideways turn, far goal upper right,
// and the near goal beyond the bench rather than a floating diamond.
const camera = { x: 50, y: -125, z: 150 };
const cameraDistance = Math.hypot(camera.x, camera.y, camera.z);
const forward = { x: -camera.x / cameraDistance, y: -camera.y / cameraDistance, z: -camera.z / cameraDistance };
const horizontal = Math.hypot(forward.x, forward.y);
const right = { x: forward.y / horizontal, y: -forward.x / horizontal, z: 0 };
const up = { x: right.y * forward.z, y: -right.x * forward.z, z: right.x * forward.y - right.y * forward.x };

export function projectManagerPitch(x: number, y: number, height = 0): Point {
	const relative = { x: (x - 0.5) * 68 - camera.x, y: (0.5 - y) * 105 - camera.y, z: height - camera.z };
	const dot = (axis: typeof relative) => relative.x * axis.x + relative.y * axis.y + relative.z * axis.z;
	const depth = dot(forward);
	return { x: 950 + 1500 * dot(right) / depth, y: 300 - 1500 * dot(up) / depth };
}

export function layoutManagerOgPlayers(players: ManagerOgPlayer[]) {
	const rows = [
		{ position: 'Goalkeeper', depth: 0.11 },
		{ position: 'Defender', depth: 0.34 },
		{ position: 'Midfielder', depth: 0.56 },
		{ position: 'Forward', depth: 0.79 },
	];
	return rows.flatMap((row) => {
		const picks = players.filter((player) => player.position === row.position);
		return picks.map((player, index) => {
			// Reserve the field edges so even five-player rows have label space.
			const across = picks.length === 1 ? 0.43 : 0.04 + 0.82 * (index + 0.5) / picks.length;
			const point = projectManagerPitch(across, row.depth);
			const head = projectManagerPitch(across, row.depth, 8);
			const shadow = projectManagerPitch(across - 0.055, row.depth + 0.035);
			const rowWidth = projectManagerPitch(0.92, row.depth).x - projectManagerPitch(0.08, row.depth).x;
			return {
				...player, ...point,
				scale: Math.hypot(head.x - point.x, head.y - point.y) / 66,
				rotation: Math.atan2(head.x - point.x, point.y - head.y) * 180 / Math.PI,
				shadow, labelWidth: Math.min(108, Math.floor(rowWidth / picks.length) - 7),
			};
		});
	});
}

const point = ({ x, y }: Point) => `${x.toFixed(2)},${y.toFixed(2)}`;
const polygon = (vertices: number[][]) => vertices.map(([x, y]) => point(projectManagerPitch(x!, y!))).join(' ');
const rectangle = (left: number, top: number, right: number, bottom: number) => polygon([[left, top], [right, top], [right, bottom], [left, bottom]]);

function figure(x: number, y: number, scale: number, goalkeeper = false, rotation = 0) {
	return `<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rotation.toFixed(2)}) scale(${scale.toFixed(3)})">
		<ellipse cy="2" rx="12" ry="3" fill="#06170d" opacity=".5"/>
		<path d="M-6-21L-7-6M6-21L8-6" stroke="#d6b193" stroke-width="5" stroke-linecap="round"/>
		<path d="M-7-10L-7-3M8-10L8-3" stroke="#f4f3e9" stroke-width="5"/>
		<path d="M-9-1L-3-1M6-1L12 0" stroke="#171e20" stroke-width="4" stroke-linecap="round"/>
		<path d="M-9-29L-8-18L-1-18L0-25L2-18L10-18L9-29Z" fill="#f4f3e9"/>
		<path d="M-9-45L-15-36L-12-32M9-45L15-36L13-32" fill="none" stroke="#d6b193" stroke-width="5" stroke-linecap="round"/>
		<path d="M-6-48L-12-44L-16-37L-9-34L-8-29Q0-26 9-29L10-35L16-38L11-44L5-48Z" fill="url(#${goalkeeper ? 'keeper' : 'shirt'})" stroke="#071a1a" stroke-opacity=".35" stroke-width=".7"/>
		<path d="M-6-47L-8-31M8-43L8-32" stroke="white" stroke-opacity=".35" stroke-width="1.5"/>
		<path d="M-4-49Q0-45 4-49" fill="none" stroke="#f7f6ed" stroke-width="2"/>
		<rect x="-3" y="-54" width="6" height="7" rx="2" fill="#c3997b"/>
		<ellipse cy="-58" rx="6.5" ry="8" fill="url(#skin)"/>
		<path d="M-6-59Q-7-68 1-67Q8-66 6-59L3-62L-4-62Z" fill="#292522"/>
	</g>`;
}

// Native SVG drawing keeps the image repeatable and independent of image APIs,
// remote assets, browser 3D transforms and random texture generation.
export function createManagerOgArtwork(players: ManagerOgPlayer[], bench: ManagerOgPlayer[], theme: ManagerOgTheme) {
	const field = rectangle(-0.025, -0.025, 1.025, 1.025);
	const bands = Array.from({ length: 10 }, (_, index) => `<polygon points="${rectangle(0, index / 10, 1, (index + 1) / 10)}" fill="${index % 2 ? '#699942' : '#173f23'}" opacity=".16"/>`).join('');
	const circle = polygon(Array.from({ length: 81 }, (_, index) => {
		const angle = index / 80 * Math.PI * 2;
		return [0.5 + Math.cos(angle) * 9.15 / 68, 0.5 + Math.sin(angle) * 9.15 / 105];
	}));
	const penaltyArc = (centre: number, start: number, end: number) => polygon(Array.from({ length: 33 }, (_, index) => {
		const angle = start + index / 32 * (end - start);
		return [0.5 + Math.cos(angle) * 9.15 / 68, centre + Math.sin(angle) * 9.15 / 105];
	}));
	const goal = (near: boolean) => {
		const y = near ? 1 : 0;
		const back = near ? 1 + 2 / 105 : -2 / 105;
		const left = 0.5 - 3.66 / 68;
		const right = 0.5 + 3.66 / 68;
		const line = (points: [number, number, number][]) => `<polyline points="${points.map(([x, y, z]) => point(projectManagerPitch(x, y, z))).join(' ')}"/>`;
		const net = Array.from({ length: 9 }, (_, i) => {
			const x = left + (right - left) * i / 8;
			return line([[x, y, 2.44], [x, back, 2.44], [x, back, 0]]);
		}).join('') + [0, 1, 2, 3, 4].map((i) => line([[left, back, i * 2.44 / 4], [right, back, i * 2.44 / 4]])).join('');
		return `<g stroke="#f3f5e8" stroke-width=".6" opacity=".75" fill="none">${net}</g><g fill="none" stroke="#fcfff5" stroke-width="2" stroke-linejoin="round">${line([[left, y, 0], [left, y, 2.44], [right, y, 2.44], [right, y, 0]])}${line([[left, y, 2.44], [left, back, 2.44], [right, back, 2.44], [right, y, 2.44]])}</g>`;
	};
	const positioned = layoutManagerOgPlayers(players);
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
		<defs>
			<linearGradient id="grass" x1="0" y1="0" x2=".4" y2="1"><stop stop-color="#3d6d2e"/><stop offset=".55" stop-color="#2a5625"/><stop offset="1" stop-color="#153c21"/></linearGradient>
			<linearGradient id="shirt"><stop stop-color="${theme.kitLight}"/><stop offset=".38" stop-color="${theme.kit}"/><stop offset="1" stop-color="#131d25"/></linearGradient>
			<linearGradient id="keeper"><stop stop-color="#e4d775"/><stop offset=".5" stop-color="#c7ac34"/><stop offset="1" stop-color="#746219"/></linearGradient>
			<radialGradient id="skin" cx=".3" cy=".25"><stop stop-color="#f2d8b5"/><stop offset="1" stop-color="#ac8060"/></radialGradient>
			<pattern id="blades" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M1 5l1-3M5 7l1-2" stroke="#d5e9ac" stroke-width=".5" opacity=".12"/><path d="M3 5l1 2" stroke="#081e13" stroke-width=".6" opacity=".25"/></pattern>
			<clipPath id="field"><polygon points="${field}"/></clipPath>
		</defs>
		<path d="M530 0H780L180 565H0V515Z" fill="${theme.highlight}" opacity=".27"/>
		<path d="M825 0H954L360 565H220Z" fill="${theme.highlight}" opacity=".17"/>
		<polygon points="${field}" fill="#0a251a" transform="translate(-6 12)" opacity=".24"/>
		<polygon points="${field}" fill="url(#grass)"/>
		<g clip-path="url(#field)">${bands}<rect x="400" y="40" width="800" height="550" fill="url(#blades)"/></g>
		<g fill="none" stroke="#f0f3db" stroke-opacity=".8" stroke-width="1.7" stroke-linejoin="round">
			<polygon points="${rectangle(0, 0, 1, 1)}"/>
			<polyline points="${polygon([[0, 0.5], [1, 0.5]])}"/>
			<polyline points="${circle}"/>
			<polygon points="${rectangle(0.5 - 20.16 / 68, 0, 0.5 + 20.16 / 68, 16.5 / 105)}"/>
			<polygon points="${rectangle(0.5 - 9.16 / 68, 0, 0.5 + 9.16 / 68, 5.5 / 105)}"/>
			<polygon points="${rectangle(0.5 - 20.16 / 68, 1 - 16.5 / 105, 0.5 + 20.16 / 68, 1)}"/>
			<polygon points="${rectangle(0.5 - 9.16 / 68, 1 - 5.5 / 105, 0.5 + 9.16 / 68, 1)}"/>
			<polyline points="${penaltyArc(11 / 105, Math.asin(5.5 / 9.15), Math.PI - Math.asin(5.5 / 9.15))}"/>
			<polyline points="${penaltyArc(1 - 11 / 105, Math.PI + Math.asin(5.5 / 9.15), Math.PI * 2 - Math.asin(5.5 / 9.15))}"/>
		</g>
		${goal(false)}
		${positioned.map((player) => `<path d="M${player.x - 3},${player.y}L${point(player.shadow)}l5,2L${player.x + 3},${player.y + 1}Z" fill="#07160d" opacity=".3"/>`).join('')}
		${positioned.map((player) => figure(player.x, player.y, player.scale, player.position === 'Goalkeeper', player.rotation)).join('')}
		${goal(true)}
		<rect y="565" width="1200" height="65" fill="${theme.ink}"/>
		${bench.slice(0, 4).map((player, index) => figure(565 + index * 155, 617, 0.55, player.position === 'Goalkeeper')).join('')}
	</svg>`;
	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
