import util from 'util'
util.inspect.defaultOptions.depth = process.env.DEBUG_DEPTH
import dotenv from 'dotenv'
dotenv.config()
import yargs from 'yargs/yargs'
import {hideBin} from 'yargs/helpers'
const argv = yargs(hideBin(process.argv)).argv
console.log({argv})
import config from './config.js'
import seederState from './lib/seeder-state.js'
import {discoverSubplebbits} from './lib/discover-subplebbits.js'
import {seedSubplebbits} from './lib/seed-subplebbits.js'

if (!config?.seeding?.multisubs) {
  console.log(`missing config.js 'seeding.multisubs'`)
  process.exit()
}

// discover subs to seed at least once before starting
discoverSubplebbits()
while (!seederState.subplebbitsSeeding) {
  console.log('retrying discovering subplebbits to seed in 10 seconds')
  await new Promise(r => setTimeout(r, 10000))
}

seedSubplebbits()
