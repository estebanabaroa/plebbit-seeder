export default {
  seeding: {
    // multisub urls or file paths to monitor (will support ipns names in the future)
    multisubs: [
      // 'https://raw.githubusercontent.com/plebbit/temporary-default-subplebbits/master/multisub.json',
      './temporary-default-subplebbits-multisub.json'
    ],
  },
  kuboRpcUrl: 'http://193.242.184.216:11111/api/v0',
  pubsubKuboRpcUrl: 'http://89.36.231.252:11111/api/v0',
  plebbitOptions: {
    ipfsGatewayUrls: [
      'https://ipfsgateway.xyz',
      'https://gateway.plebpubsub.xyz',
      'https://gateway.forumindex.com',
      'https://ipfs.io'
    ],
    pubsubKuboRpcClientsOptions: ['https://pubsubprovider.xyz/api/v0'],
    chainProviders: {
      eth: {urls: ['https://ethrpc.xyz', 'viem', 'ethers.js'], chainId: 1},
      sol: {urls: ['https://solrpc.xyz', 'web3.js'], chainId: 1}
    },
    httpRoutersOptions: [
      'https://routing.lol',
      'https://peers.pleb.bot',
      'https://peers.plebpubsub.xyz',
      'https://peers.forumindex.com'
    ],
    resolveAuthorAddresses: false
  }
}
