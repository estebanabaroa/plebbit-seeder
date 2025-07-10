import config from '../config.js'
import {fetchMultisubUrl} from './utils.js'
import seederState from './seeder-state.js'
import 'dotenv/config'

const multisubs = []
const discoverSubplebbitsFromMultisubs = async () => {
  console.log(`discovering subplebbits from ${config.seeding.multisubs.length} multisubs`)
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
      // always overwrite the subplebbit with the latest data
      subplebbitsMap.set(subplebbit.address, subplebbit)
    }
  }

  // set initial state
  if (subplebbitsMap.size > 0) {
    seederState.subplebbitsSeeding = [...subplebbitsMap.values()]
  }
}

// discover subs from dune.com
const duneApiKey = process.env.DUNE_API_KEY
const discoverSubplebbitsFromDune = async () => {
  if (!duneApiKey) {
    return
  }

  // fetch results once a day
  const day = 24 * 60 * 60 * 1000
  if (Date.now() - (seederState.dune.lastResultsTimestamp || 0) > day) {
    let text, error
    try {
      text = await fetch(
        'https://api.dune.com/api/v1/query/3740068/results?limit=1000', 
        {headers: {'X-Dune-API-Key': duneApiKey}}
      ).then(res => res.text())
      const json = JSON.parse(text)
      const subplebbitAddresses = json.result.rows.map(row => row.name)
      const subplebbitsMap = new Map(seederState.subplebbitsSeeding?.map(subplebbit => [subplebbit.address, subplebbit]))
      for (const subplebbitAddress of subplebbitAddresses) {
        if (!subplebbitsMap.has(subplebbitAddress)) {
          subplebbitsMap.set(subplebbitAddress, {address: subplebbitAddress})
        }
      }
      // set initial state
      if (subplebbitsMap.size > 0) {
        seederState.subplebbitsSeeding = [...subplebbitsMap.values()]
      }
    }
    catch (e) {
      error = e
    }
    seederState.dune.lastResultsTimestamp = Date.now()
    console.log('dune query results', {response: text, error})
  }

  // execute query once every 3 days
  if (Date.now() - (seederState.dune.lastExecuteTimestamp || 0) > day * 3) {
    let text, error
    try {
      text = await fetch(
        'https://api.dune.com/api/v1/query/3740068/execute', 
        {method: 'POST', headers: {'X-Dune-API-Key': duneApiKey}}
      ).then(res => res.text())
    }
    catch (e) {
      error = e
    }

    seederState.dune.lastExecuteTimestamp = Date.now()
    console.log('dune query execute', {response: text, error})
  }
}

export const discoverSubplebbits = () => {
  discoverSubplebbitsFromMultisubs().catch(console.log)
  setInterval(() => {
    discoverSubplebbitsFromMultisubs().catch(console.log)
    discoverSubplebbitsFromDune().catch(console.log)
  }, 10 * 60 * 1000)
}
