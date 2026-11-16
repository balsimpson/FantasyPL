const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// Exercise the actual TypeScript utilities and handler without Nuxt or provider calls.
function load(relative, mocks = {}, globals = {}) {
  const filename = path.resolve(__dirname, '..', relative);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  const localRequire = (name) => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (!name.startsWith('.')) return require(name);
    return load(path.relative(path.resolve(__dirname, '..'), path.resolve(path.dirname(filename), `${name}.ts`)), mocks, globals);
  };
  new Function('require', 'module', 'exports', ...Object.keys(globals), code)(localRequire, module, module.exports, ...Object.values(globals));
  return module.exports;
}
const { buildManagerTransferOptions: build, rankManagerTransferSuggestions: rank, buildManagerSellingPrices: prices } = load('server/utils/manager-recommendations.ts');
const { buildManagerWeekPlan } = load('utils/manager-planner.ts');
const positions = [1, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 1, 2, 4, 2];
function fixture() {
  const elements = positions.map((position, index) => ({
    id: index + 1, web_name: `Player ${index + 1}`, team: index % 5 + 1, element_type: position,
    status: 'a', chance_of_playing_next_round: null, now_cost: 50, cost_change_start: 0,
    minutes: 900, points_per_game: '5', form: '3', ep_next: '4', total_points: 50,
  }));
  elements[12] = { ...elements[12], status: 'd', chance_of_playing_next_round: 50, news: 'Calf injury - 50% chance of playing' };
  elements[13] = { ...elements[13], status: 'i', chance_of_playing_next_round: 0, points_per_game: '7.8', ep_next: '0', news: 'Thigh injury - Unknown return date' };
  const candidate = (id, position, extra = {}) => ({ ...elements[0], id, web_name: `Candidate ${id}`, team: 6, element_type: position, points_per_game: '2', form: '2', ep_next: '2', ...extra });
  elements.push(candidate(16, 2), candidate(17, 4), candidate(18, 3, { form: '8', points_per_game: '8', ep_next: '8' }));
  const picks = positions.map((_, i) => ({ element: i + 1, position: i + 1, is_captain: i === 9 }));
  const teams = Array.from({ length: 20 }, (_, i) => ({ id: i + 1, name: `Club ${i + 1}` }));
  const fixtures = [11, 12].flatMap(event => Array.from({ length: 10 }, (_, i) => ({ id: event * 100 + i, event, team_h: i + 1, team_a: 20, team_h_difficulty: 3, team_a_difficulty: 3 })));
  const context = { chip: 'none', targetGameweek: 11, gameweeks: [11, 12], fixtures };
  const sellingPrices = new Map(picks.map(p => [p.element, 50]));
  const args = [picks, elements, teams, sellingPrices, 0, 10, 11];
  return { elements, picks, teams, fixtures, context, sellingPrices, args, candidate };
}

test('injured and doubtful bench players get affordable fit replacements despite lower historical PPG', () => {
  const f = fixture();
  const options = build(...f.args, f.context);
  assert.ok(options.some(o => o.outgoing.id === 13 && o.incoming.id === 16));
  assert.ok(options.some(o => o.outgoing.id === 14 && o.incoming.id === 17));
  assert.ok(options.every(o => o.kind === 'availability'));
  assert.match(options[0].reason, /Published bench/);
  assert.deepEqual(rank(options, {}).map(o => o.outgoing.id), [14, 13]);
});

test('normal and Triple Captain retain the exact suggested XI; chip rebuilds can review it', () => {
  const f = fixture();
  const picks = f.picks.map(p => ({ ...p, element: f.elements.find(e => e.id === p.element) }));
  const plan = buildManagerWeekPlan({ picks, startingXI: picks.slice(0, 11), teams: f.teams }, f.fixtures, 11);
  assert.equal(plan.canPreview, true);
  const retained = new Set(plan.squad.startingXI.map(p => p.element.id));
  for (const chip of ['none', '3xc']) assert.ok(build(...f.args, { ...f.context, chip }).every(o => !retained.has(o.outgoing.id)));
  for (const chip of ['bboost', 'wildcard', 'freehit']) assert.ok(build(...f.args, { ...f.context, chip }).some(o => retained.has(o.outgoing.id)));
});

test('availability fixes still enforce price, position, club limit, ownership and playing evidence', () => {
  const f = fixture();
  f.elements.push(f.candidate(20, 4, { now_cost: 51 }), f.candidate(21, 4, { status: 'd', chance_of_playing_next_round: 75 }), f.candidate(22, 4, { team: 1 }), f.candidate(23, 4, { minutes: 0 }), f.candidate(24, 4, { form: '0', ep_next: '0' }));
  const options = build(...f.args, f.context);
  assert.ok(options.filter(o => o.outgoing.id === 14).every(o => o.incoming.id === 17));
});

test('unknown fixtures retain availability fixes but do not sell healthy players without a suggested XI', () => {
  const f = fixture();
  const options = build(...f.args, { chip: 'none' });
  assert.ok(options.length);
  assert.ok(options.every(o => o.kind === 'availability'));
});

test('a future gameweek never uses the next-gameweek estimate', () => {
  const f = fixture();
  const options = build(...f.args, { ...f.context, targetGameweek: 12, gameweeks: [12] });
  assert.ok(options.length);
  assert.ok(options.every(o => o.incoming.expectedPoints === null && o.outgoing.expectedPoints === null));
});

test('one-week chips prefer scheduled doubles and reject blank-week replacements', () => {
  const f = fixture();
  f.elements.push(f.candidate(19, 4, { team: 7, points_per_game: '1' }));
  f.fixtures.push({ id: 999, event: 11, team_h: 7, team_a: 20, team_h_difficulty: 3, team_a_difficulty: 3 });
  for (const chip of ['freehit', 'bboost']) {
    const options = build(...f.args, { ...f.context, chip });
    assert.equal(options.find(o => o.outgoing.id === 14).incoming.id, 19);
  }
  f.fixtures = f.fixtures.filter(row => row.team_h !== 6);
  const options = build(...f.args, { ...f.context, fixtures: f.fixtures });
  assert.ok(!options.some(o => o.incoming.id === 17));
});

test('one shared incoming option must not hide a second flagged outgoing player', () => {
  const f = fixture();
  f.elements[14].status = 'i';
  const options = build(...f.args, f.context);
  const answers = Object.fromEntries(options.map(o => [o.questionId, { type: 'score', score: 0 }]));
  const ranked = rank(options, answers);
  assert.ok(ranked.some(o => o.outgoing.id === 13));
  assert.ok(ranked.some(o => o.outgoing.id === 15));
  assert.equal(new Set(ranked.map(o => o.outgoing.id)).size, ranked.length);
});

test('unscored optional upgrades stay hidden while injury replacements survive provider failure', () => {
  const f = fixture();
  const options = build(...f.args, { ...f.context, chip: 'wildcard' });
  assert.ok(options.some(o => o.kind === 'performance'));
  assert.ok(rank(options, {}).every(o => o.kind === 'availability'));
  const answers = Object.fromEntries(options.map(o => [o.questionId, { type: 'score', score: 4 }]));
  assert.ok(rank(options, answers).some(o => o.kind === 'performance'));
});

test('sale values exclude Free Hit transfers and withhold only uncertain acquisitions', () => {
  const f = fixture();
  const transfers = [{ entry: 1, event: 9, element_in: 14, element_out: 100, element_in_cost: 40, time: '2026-10-01T00:00:00Z' }];
  assert.equal(prices(f.picks, f.elements, transfers, new Set(), 1).get(14), 45);
  assert.equal(prices(f.picks, f.elements, transfers, new Set([9]), 1).get(14), 50);
  const uncertain = prices(f.picks, f.elements, transfers, new Set(), 1, new Set([9]));
  assert.equal(uncertain.has(14), false);
  assert.equal(uncertain.get(13), 50);
});

function handlerFixture({ chip = 'none', gameweek, historyMissing = false, activeChip = null, providerFails = false, fixturesMissing = false, transfers = [] } = {}) {
  const f = fixture();
  const picksCalls = [], providerBodies = [];
  const selection = { picks: f.picks, active_chip: activeChip, entry_history: { bank: 0 } };
  const handler = load('server/api/managers/[id]/recommendations.get.ts', {
    '~~/composables/usePremiereLeague': {
      getManagerPicks: async (_, week) => { picksCalls.push(week); return week === 10 ? selection : { ...selection, active_chip: null, entry_history: { bank: 5 } }; },
      getManagerTransfers: async () => transfers,
      getManagerHistory: async () => { if (historyMissing) throw Error('offline'); return { chips: activeChip ? [{ name: activeChip, event: 10 }] : [] }; },
    },
    '../../../utils/manager-fixtures': { getManagerFixtures: async () => { if (fixturesMissing) throw Error('offline'); return { gameweeks: [11, 12], fixtures: f.fixtures }; } },
  }, {
    defineEventHandler: fn => fn, setResponseHeader: () => {}, getRouterParam: () => '1', getQuery: () => ({ chip, ...(gameweek === undefined ? {} : { gameweek }) }),
    useRuntimeConfig: () => ({ JEV_API_KEY: 'mock-only' }), createError: x => Object.assign(new Error(x.statusMessage), x),
    $fetch: async (url, options) => {
      if (url === '/api/managers/1') return { current_event: 10 };
      if (url === '/api/bootstrap-static') return { elements: f.elements, teams: f.teams, events: [{ id: 11, is_next: true }] };
      assert.equal(url, 'https://api.typesafe.ai/v1/systemone');
      providerBodies.push(options.body);
      if (providerFails) throw Error('provider offline');
      return { answers: Object.fromEntries(Object.keys(options.body.questions).map(id => [id, { type: 'score', score: 3 }])) };
    },
  }).default;
  return { handler: () => handler({}), picksCalls, providerBodies, f };
}

test('missing chip history still returns injured bench replacements without provider use', async () => {
  const h = handlerFixture({ historyMissing: true });
  const result = await h.handler();
  assert.equal(result.chipHistory, null);
  assert.equal(result.attention.length, 2);
  assert.equal(result.suggestions.length, 2);
  assert.equal(h.providerBodies.length, 0);
});

test('published Free Hit restores the previous permanent squad and bank', async () => {
  const h = handlerFixture({ activeChip: 'freehit' });
  const result = await h.handler();
  assert.deepEqual(h.picksCalls, [10, 9]);
  assert.equal(result.squadGameweek, 9);
  assert.ok(result.suggestions.every(o => o.bankAfter === 0.5));
  assert.match(result.squadNote, /permanent squad before Free Hit/);
});

test('a previously used chip is context, not an assumed next-week activation', async () => {
  const result = await handlerFixture({ activeChip: 'bboost' }).handler();
  assert.equal(result.chip, 'none');
  assert.equal(result.publishedChip, 'bboost');
});

test('provider outage keeps availability repairs visible and avoids caching the failure', async () => {
  const result = await handlerFixture({ chip: 'wildcard', providerFails: true }).handler();
  assert.equal(result.rankingUnavailable, true);
  assert.equal(result.fingerprint, undefined);
  assert.ok(result.suggestions.length);
  assert.ok(result.suggestions.every(o => o.kind === 'availability'));
});

test('chip plans supply the correct fixture horizon to the ranking service', async () => {
  for (const chip of ['bboost', 'freehit', 'wildcard']) {
    const h = handlerFixture({ chip });
    await h.handler();
    assert.deepEqual(h.providerBodies[0].state.planningGameweeks, chip === 'wildcard' ? [11, 12] : [11]);
    assert.equal(h.providerBodies[0].state.squad.length, 15);
  }
});

test('selected-week requests, invalid plans and fixture outages have explicit results', async () => {
  const result = await handlerFixture({ gameweek: 12 }).handler();
  assert.equal(result.targetGameweek, 12);
  assert.ok(result.suggestions.every(o => o.incoming.expectedPoints === null));
  await assert.rejects(handlerFixture({ chip: 'bad-chip' }).handler, { statusCode: 400 });
  await assert.rejects(handlerFixture({ gameweek: 30 }).handler, { statusCode: 400 });
  const fallback = await handlerFixture({ fixturesMissing: true }).handler();
  assert.match(fallback.lineupNote, /Fixtures could not load/);
  assert.equal(fallback.suggestions.length, 2);
});

test('recent form and fixture evidence can rank above stronger historical PPG', () => {
  const f = fixture();
  f.elements.push(f.candidate(19, 4, { points_per_game: '6', form: '0.2' }), f.candidate(20, 4, { points_per_game: '4', form: '6' }));
  const options = build(...f.args, f.context);
  assert.equal(options.find(o => o.outgoing.id === 14).incoming.id, 20);
});

test('missing chip history checks transfer-event picks before reconstructing sale values', async () => {
  const h = handlerFixture({ historyMissing: true, transfers: [{ entry: 1, event: 8, element_in: 14, element_out: 99, element_in_cost: 40, time: '2026-10-01T00:00:00Z' }] });
  const result = await h.handler();
  assert.deepEqual(h.picksCalls, [10, 8]);
  assert.equal(result.chipHistory, null);
  assert.ok(result.attention.some(p => p.id === 14));
});

test('week and chip switches ignore late responses and keep separate caches', async () => {
  const vue = require('vue');
  const pending = [], stops = [], cleanup = [], storage = new Map();
  const { useManagerTransferRecommendations } = load('composables/useManagerTransferRecommendations.ts', {}, {
    ref: vue.ref, computed: vue.computed,
    watch: (...args) => { const stop = vue.watch(...args); stops.push(stop); return stop; },
    onMounted: fn => fn(), onBeforeUnmount: fn => cleanup.push(fn),
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    $fetch: (_, options) => new Promise(resolve => pending.push({ resolve, options })),
  });
  const manager = vue.ref(1), gameweek = vue.ref(11), chip = vue.ref('none');
  const state = useManagerTransferRecommendations(manager, gameweek, chip);
  chip.value = 'bboost'; await vue.nextTick();
  const fresh = { suggestions: [], chip: 'bboost', fingerprint: 'b'.repeat(64) };
  pending[1].resolve(fresh); await new Promise(resolve => setImmediate(resolve));
  pending[0].resolve({ suggestions: [], chip: 'none', fingerprint: 'a'.repeat(64) }); await new Promise(resolve => setImmediate(resolve));
  assert.equal(state.result.value.chip, 'bboost');
  assert.equal(state.loading.value, false);
  assert.deepEqual([...storage.keys()], ['manager-recommendations:v2:1:11:bboost']);
  gameweek.value = 12; await vue.nextTick();
  assert.equal(state.result.value, null);
  assert.equal(pending[2].options.query.gameweek, 12);
  cleanup.forEach(fn => fn()); stops.forEach(fn => fn());
});
