import config from '../config.js'
import {fetchMultisubUrl} from './utils.js'
import seederState from './seeder-state.js'
import {kubo, kuboPubsub, plebbitKuboRpc, plebbitPubsubKuboRpc} from './plebbit.js'

// join all IPNS over pubsub
// TODO: make sure reproviding is working
const subplebbitsUpdating = {}
const seedSubplebbits = () => {
  for (const {address} of seederState.subplebbitsSeeding) {
    if (subplebbitsUpdating[address]) {
      continue
    }
    plebbit.createSubplebbit({address}).then(async subplebbit => {
      subplebbitsUpdating[address] = subplebbit
      subplebbit.on('update', () => {
        subplebbitsUpdating[address] = subplebbit
        // every time there's a new subplebbit update, download and seed all first pages and all post updates
      })
      await subplebbit.update()
    }).catch(console.log)
  }
}
seedSubplebbits().catch(console.log)
setInterval(() => {
  seedSubplebbits().catch(console.log)
}, 10 * 60 * 1000)

// join all pubsub topics
// TODO: make sure reproviding is working
const pubsubTopicsJoined = {}
const joinPubsubTopics = () => {
  const pubsubTopics = Object.values(subplebbitsUpdating).map(subplebbit => subplebbit.pubsubTopic)

  // remove pubsub topics that no longer exist
  for (pubsubTopic in pubsubTopicsJoined) {
    if (!pubsubTopics.includes(pubsubTopic)) {
      // TODO: remove
    }
  }

  for (const pubsubTopic of pubsubTopics) {
    if (pubsubTopicsJoined[pubsubTopic]) {
      continue
    }
    // TODO: join
  }
}
setInterval(() => {
  joinPubsubTopics().catch(console.log)
}, 60 * 1000)
