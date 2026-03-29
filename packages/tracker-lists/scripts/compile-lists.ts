/**
 * Compiles raw tracker lists (EasyList, Disconnect, EasyPrivacy)
 * into optimized JSON files for embedding in the plugin.
 * Run: pnpm lists:compile
 */
import { writeFileSync } from 'fs'
import { join } from 'path'

console.log('Compiling tracker lists... (placeholder — fetch & compile logic here)')

const placeholder = {
  name: 'placeholder',
  version: '0.0.1',
  domains: {},
}

writeFileSync(
  join(import.meta.dirname, '../data/easylist.json'),
  JSON.stringify(placeholder, null, 2),
)
writeFileSync(
  join(import.meta.dirname, '../data/disconnect.json'),
  JSON.stringify(placeholder, null, 2),
)
writeFileSync(
  join(import.meta.dirname, '../data/easyprivacy.json'),
  JSON.stringify(placeholder, null, 2),
)

console.log('Done.')
