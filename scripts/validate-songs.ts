import { readFileSync } from 'node:fs';
import { validateSongs } from '../src/data/validate';

const file = process.argv[2] ?? new URL('../src/data/songs.json', import.meta.url);
const songs = JSON.parse(readFileSync(file, 'utf8')) as unknown[];
const problems = validateSongs(songs);

if (problems.length > 0) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`${songs.length} Songs OK`);
