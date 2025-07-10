import fs from 'fs'
import config from '../config.js'

// no initial state, the app state is set by importing this file and adding props to this object
let seederState = {
  subplebbitsSeeding: undefined, // keep undefined until discover-subplebbits.js fetches subplebbits to seed
  dune: {}
}

// try to load state from disk on startup
try {
  seederState = JSON.parse(fs.readFileSync('seederState.json', 'utf8'))
}
catch (e) {}

export default seederState

// migrate to new schema: add dune
if (!seederState.dune) {
  seederState.dune = {}
}

// save state to disk every 1min
setInterval(() => {
  if (config.seederState?.writeFile !== false) {
    fs.writeFileSync('seederState.json', JSON.stringify(seederState, null, 2))
  }
}, 1000 * 60)
