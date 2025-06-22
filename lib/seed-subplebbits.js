import config from '../config.js'
import {getTimeAgo} from './utils.js'
import seederState from './seeder-state.js'
import {kubo, kuboPubsub, plebbitKuboRpc, plebbitPubsubKuboRpc} from './plebbit.js'

const logMessage = (prefix) => (error) => console.log(`${prefix} ${error?.message}`)

// join all IPNS over pubsub
// TODO: make sure reproviding is working
const subplebbitsUpdating = {}
const pinsToRemove = {}
const subscribeSubplebbitsUpdates = async () => {
  console.log(`seeding ${seederState.subplebbitsSeeding.length} subplebbits`)
  for (const {address} of seederState.subplebbitsSeeding) {
    if (subplebbitsUpdating[address]) {
      continue
    }
    plebbitKuboRpc.createSubplebbit({address}).then(async subplebbit => {
      subplebbitsUpdating[address] = subplebbit
      subplebbit.on('update', async () => {
        subplebbitsUpdating[address] = subplebbit

        // every time there's a new subplebbit update, download and seed all first pages and all post updates
        const cidsToPin = []
        for (const sortType in subplebbit.posts?.pageCids) {
          cidsToPin.push({name: `page ${sortType}`, cid: subplebbit.posts?.pageCids[sortType]})
        }
        for (const sortType in subplebbit.posts?.pages) {
          const page = subplebbit.posts.pages[sortType]
          if (page.nextCid) {
            cidsToPin.push({name: `next page ${sortType}`, cid: page.nextCid})
          }
        }
        const pageCidCount = cidsToPin.length

        for (const timeBucket in subplebbit.postUpdates) {
          cidsToPin.push({name: `post updates ${timeBucket}`, cid: subplebbit.postUpdates[timeBucket]})
        }
        const postUpdatesCount = cidsToPin.length - pageCidCount
        const firstPagePostCount = Object.values(subplebbit.posts?.pages || {})[0]?.comments?.length
        console.log(`${subplebbit.address} updated ${getTimeAgo(subplebbit.updatedAt)}, page cids: ${pageCidCount}, post updates cids: ${postUpdatesCount}, first page posts: ${firstPagePostCount}`)

        // removing previous pins
        console.log(`${subplebbit.address} removing ${pinsToRemove[address]?.length || 0} pins`)
        for (const pin of pinsToRemove[address] || []) {
          await kubo.pin.rm(pin, {recursive: true}).catch(logMessage(subplebbit.address))
        }
        pinsToRemove[address] = cidsToPin.map(i => i.cid)

        // download and pin new cids
        for (const {name, cid} of cidsToPin) {
          const before = Date.now()
          console.log(`${subplebbit.address} pinning ${cid} (${name})`)
          kubo.pin.add(cid, {recursive: true})
            .then(async (res) => {
              console.log(`${subplebbit.address} pinned ${cid} (${name}) in ${(Date.now() - before) / 1000}s`)
            })
            .catch(logMessage(subplebbit.address))
        }
      })
      await subplebbit.update()
    }).catch(console.log)
  }
}

// join all pubsub topics
// TODO: make sure reproviding is working
const pubsubTopicsJoined = {}
const joinPubsubTopics = async () => {
  const pubsubTopics = Object.values(subplebbitsUpdating).map(subplebbit => subplebbit.pubsubTopic)

  // remove pubsub topics that no longer exist
  for (const pubsubTopic in pubsubTopicsJoined) {
    if (!pubsubTopics.includes(pubsubTopic)) {
      const {subplebbit, unsubscribe} = pubsubTopicsJoined[pubsubTopic]
      unsubscribe().catch(logMessage(subplebbit.address))
      console.log(`${subplebbit.address} unsubscribed pubsub`)
    }
  }

  // join pubsub topics
  for (const subplebbit of Object.values(subplebbitsUpdating)) {
    const pubsubTopic = subplebbit.pubsubTopic
    if (!pubsubTopic || pubsubTopicsJoined[pubsubTopic]) {
      continue
    }
    const onMessage = () => {
      console.log(`${subplebbit.address} new pubsub message`)
    }
    const onError = (error) => {
      console.log(`${subplebbit.address} pubsub subscribe onError`, error)
    }
    kuboPubsub.pubsub.subscribe(pubsubTopic, onMessage, {onError}).then(() => {
      console.log(`${subplebbit.address} subscribed pubsub`)
      const unsubscribe = () => kuboPubsub.pubsub.unsubscribe(pubsubTopic, onMessage)
      pubsubTopicsJoined[pubsubTopic] = {subplebbit, unsubscribe}
    }).catch(logMessage(subplebbit.address))
  }
}

export const seedSubplebbits = () => {
  subscribeSubplebbitsUpdates().catch(console.log)
  setInterval(() => {
    subscribeSubplebbitsUpdates().catch(console.log)
  }, 10 * 60 * 1000)

  setInterval(() => {
    joinPubsubTopics().catch(console.log)
  }, 60 * 1000)
}
