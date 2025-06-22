import {stripHtml} from 'string-strip-html'
import fs from 'fs'

export const fetchJson = async (url, options) => {
  const headers = {...options?.headers, 'Content-Type': 'application/json'}
  let textResponse = await fetch(url, {...options, headers}).then((res) => res.text())
  try {
    const json = JSON.parse(textResponse)
    return json
  }
  catch (e) {
    try {
      textResponse = stripHtml(textResponse).result
    }
    catch (e) {}
    throw Error(`failed fetching got response '${textResponse.substring(0, 300).replace(/\s*\n\s*/g, ' ')}'`)
  }
}

export const fetchMultisubUrl = async (multisubUrl) => {
  // if url is a file, try to read the file
  if (!multisubUrl.startsWith('http')) {
    return JSON.parse(fs.readFileSync(multisubUrl, 'utf8'))
  }

  console.log(`fetching multisub url '${multisubUrl}'`)
  let multisub
  try {
    multisub = await fetchJson(multisubUrl)
  } 
  catch (e) {
    throw Error(`failed fetching multisub from url '${multisubUrl}': ${e.message}`)
  }
  if (!Array.isArray(multisub.subplebbits)) {
    throw Error(`failed fetching multisub from url '${multisubUrl}' got response '${JSON.stringify(multisub).substring(0, 300).replace(/\s*\n\s*/g, ' ')}'`)
  }
  return multisub
}