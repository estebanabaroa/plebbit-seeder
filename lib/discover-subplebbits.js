import config from '../config.js'
import {fetchMultisubUrl} from './utils.js'
import seederState from './seeder-state.js'

const multisubs = []
const discoverSubplebbitsFromMultisubs = async () => {
  const promises = await Promise.allSettled(config.seeding.multisubs.map(multisubUrl => fetchMultisubUrl(multisubUrl)))
  for (const [i, {status, value: multisub, reason}] of promises.entries()) {
    if (status === 'fulfilled') {
      multisubs[i] = multisub
    }
    else {
      console.log(`failed getting subplebbits to monitor (${i + 1} of ${promises.length}): ${reason}`)
    }
  }

  const subplebbitsMap = new Map(seederState.subplebbitsSeeding?.map(subplebbit => [subplebbit.address, subplebbit]))
  for (const multisub of multisubs) {
    if (!multisub) {
      continue
    }
    for (const subplebbit of multisub.subplebbits) {
      if (!subplebbitsMap.has(subplebbit.address)) {
        subplebbitsMap.set(subplebbit.address, subplebbit)
      }
    }
  }

  // set initial state
  if (subplebbitsMap.size > 0) {
    seederState.subplebbitsSeeding = [...subplebbitsMap.values()]
  }
}
discoverSubplebbitsFromMultisubs().catch(console.log)
setInterval(() => {
  discoverSubplebbitsFromMultisubs().catch(console.log)
}, 10 * 60 * 1000)

const discoverSubplebbitsFromDune = async () => {

}
