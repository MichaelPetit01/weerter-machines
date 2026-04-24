const bcrypt = require('bcryptjs');
const db = require('./db');

const existing = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (existing.count > 0) {
  console.log('Database al gevuld. Sla seeding over.');
  process.exit(0);
}

// Users
const insertUser = db.prepare('INSERT INTO users (username, display_name, password_hash) VALUES (?, ?, ?)');
const michael = insertUser.run('Michael', 'Michael', bcrypt.hashSync('Michael-Supermachine-2026', 10));
const lars = insertUser.run('Lars', 'Lars', bcrypt.hashSync('Lars-Supermachine-2026', 10));
const michaelId = michael.lastInsertRowid;
const larsId = lars.lastInsertRowid;

// Trainings
const insertTraining = db.prepare(`
  INSERT INTO trainings (date, title, description, sport_type, is_extra, created_by)
  VALUES (?, ?, ?, ?, 0, ?)
`);
const insertBlock = db.prepare(`
  INSERT INTO training_blocks (training_id, order_index, distance_value, distance_unit, duration_minutes)
  VALUES (?, ?, ?, ?, ?)
`);

function addTraining(date, title, description, sport_type, blocks) {
  const res = insertTraining.run(date, title, description, sport_type, michaelId);
  const tid = res.lastInsertRowid;
  blocks.forEach((b, i) => insertBlock.run(tid, i, b.distance, b.unit, b.duration));
  return tid;
}

const schema = [
  // Week 1: Apr 28 – May 3
  ['2026-04-28', 'Rustige duurloop', 'Begin rustig. Voel hoe je benen lopen en bouw voorzichtig op.', 'hardlopen', [{distance: 5, unit: 'km', duration: 28}]],
  ['2026-04-30', 'Techniek & uithouding', 'Focus op je slagtechniek. Rustig tempo, maar efficiënt bewegen.', 'zwemmen', [{distance: 750, unit: 'm', duration: 18}]],
  ['2026-05-02', 'Rustige uitrijrit', 'Eerste fietsrit van het schema. Gewoon lekker rijden, geen stress.', 'fietsen', [{distance: 25, unit: 'km', duration: 55}]],

  // Week 2: May 5 – May 11
  ['2026-05-05', 'Tempoduurloop 7km', 'Iets meer gas. Stevig tempo aanhouden gedurende de hele loop.', 'hardlopen', [{distance: 7, unit: 'km', duration: 38}]],
  ['2026-05-07', 'Duurzwemmen 1000m', 'Rustig doorzwemmen. Focus op ademhaling en regelmaat.', 'zwemmen', [{distance: 1000, unit: 'm', duration: 22}]],
  ['2026-05-09', 'Langere fietsrit 35km', 'Langere rit op rustig tempo. Voel je benen werken.', 'fietsen', [{distance: 35, unit: 'km', duration: 72}]],

  // Week 3: May 12 – May 18
  ['2026-05-12', 'Intervallen 4x800m', 'Vier keer 800 meter op goed tempo met 2 min rust ertussen. Warm op 1km, koel af 1km.', 'hardlopen', [
    {distance: 1, unit: 'km', duration: 7},
    {distance: 3.2, unit: 'km', duration: 14},
    {distance: 1, unit: 'km', duration: 7},
  ]],
  ['2026-05-14', 'Race pace zwemmen 750m', 'Zwem op wedstrijdtempo. Snel maar haalbaar. Zo ga je het doen op 13 juni.', 'zwemmen', [{distance: 750, unit: 'm', duration: 16}]],
  ['2026-05-15', 'Krachttempo fietsen 25km', 'Stevig tempo, een tandje meer dan normaal. Push jezelf.', 'fietsen', [{distance: 25, unit: 'km', duration: 50}]],
  ['2026-05-17', 'Lange duurloop 8km', 'Langste looptraining tot nu toe. Rustig maar doorbijten.', 'hardlopen', [{distance: 8, unit: 'km', duration: 47}]],

  // Week 4: May 19 – May 25 (brick week!)
  ['2026-05-20', 'Snelheidstraining 8x100m', 'Acht keer 100 meter met 30 seconden rust. Ga hard! Dit bouwen we snelheid mee.', 'zwemmen', [{distance: 800, unit: 'm', duration: 16}]],
  ['2026-05-22', 'Brick: Fietsen 20km', 'Fiets stevig 20km. Daarna direct overstappen op hardlopen (zie volgende training). Dit is het gevoel op racedag.', 'fietsen', [{distance: 20, unit: 'km', duration: 40}]],
  ['2026-05-22', 'Brick: Doorlopen 3km', 'Direct na de fiets. Je benen voelen als klei — dat is normaal. Gewoon doorlopen, dat went.', 'hardlopen', [{distance: 3, unit: 'km', duration: 18}]],
  ['2026-05-24', 'Tempoduurloop 6km', 'Steeds een beetje harder worden door de loop heen.', 'hardlopen', [{distance: 6, unit: 'km', duration: 30}]],

  // Week 5: May 26 – Jun 1 (zwaarste week)
  ['2026-05-26', 'Intervallen 5x1km', 'Vijf keer 1 kilometer op stevig tempo. 2 min rust ertussen. Warm op en koel af.', 'hardlopen', [
    {distance: 1, unit: 'km', duration: 7},
    {distance: 5, unit: 'km', duration: 25},
    {distance: 1, unit: 'km', duration: 6},
  ]],
  ['2026-05-28', 'Open water simulatie 1000m', 'Zwem alsof je in open water bent. Geen aanraking aan de baan, richt op een punt.', 'zwemmen', [{distance: 1000, unit: 'm', duration: 20}]],
  ['2026-05-30', 'Langste fietsrit 40km', 'De grote rit. Rustig maar dóórgaan. Eet en drink goed onderweg.', 'fietsen', [{distance: 40, unit: 'km', duration: 82}]],

  // Week 6: Jun 2 – Jun 8 (afbouw)
  ['2026-06-02', 'Laatste serieuze loop 5km', 'Laatste stevige looptraining. Voelt lekker want je bent fit.', 'hardlopen', [{distance: 5, unit: 'km', duration: 26}]],
  ['2026-06-04', 'Race pace afsluiter 750m', 'Precies race distance, precies race tempo. Voel dat je er klaar voor bent.', 'zwemmen', [{distance: 750, unit: 'm', duration: 15}]],
  ['2026-06-06', 'Uitrijden en ontspannen', 'Geen stress, geen tempo. Benen losmaken en genieten.', 'fietsen', [{distance: 15, unit: 'km', duration: 32}]],

  // Race week: Jun 9 – Jun 13
  ['2026-06-09', 'Losse benen activatie', 'Kort en fris. Niet te zwaar. Gewoon even bewegen.', 'hardlopen', [{distance: 3, unit: 'km', duration: 15}]],
  ['2026-06-11', 'Kort & fris zwemmen', 'Even door het water. Niets meer dan dat.', 'zwemmen', [{distance: 400, unit: 'm', duration: 9}]],
];

schema.forEach(([date, title, desc, sport, blocks]) => addTraining(date, title, desc, sport, blocks));

// Sample messages
const insertMsg = db.prepare('INSERT INTO messages (sender_user_id, body, created_at) VALUES (?, ?, ?)');
insertMsg.run(michaelId, 'Het schema staat klaar. Laten we dit doen 💪', '2026-04-24 09:00:00');
insertMsg.run(larsId, '13 juni wordt ons moment. Geen excuses.', '2026-04-24 09:05:00');
insertMsg.run(michaelId, 'Eerste training maandag. Tot dan: rust en eten.', '2026-04-24 09:10:00');
insertMsg.run(larsId, 'Ik ben klaar. De Weerter Machines gaan draaien 🔥', '2026-04-24 09:15:00');

console.log('✅ Database succesvol gevuld!');
console.log(`   → ${schema.length} trainingen aangemaakt`);
console.log('   → 2 gebruikers aangemaakt (Michael & Lars)');
console.log('   → 4 voorbeeldberichten aangemaakt');
