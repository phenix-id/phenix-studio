const MODE = process.env.MODE || ''

export const didExamples: Record<string, string> = {
  'did:indy:bcovrin:testnet': 'did:indy:bcovrin:testnet:123abc456xyz',
  'did:indy:indicio:demonet': 'did:indy:indicio:demonet:abc123xyz789',
  'did:indy:indicio:mainnet': 'did:indy:indicio:mainnet:did123example',
  'did:indy:indicio:testnet': 'did:indy:indicio:testnet:xyz987abc654',
  'did:polygon:testnet': 'did:polygon:testnet:0xabcdef123456',
  'did:polygon:mainnet': 'did:polygon:mainnet:0x1234abcd5678',
  'did:key': 'did:key:z6MkfExampleAbc123',
  'did:web': 'did:web:example.com',
}

export const protocolOptions = [
  {
    id: 'didcomm',
    title: 'DIDComm',
    desc: 'Use decentralized identifiers for peer-to-peer verifiable communication.',
    icon: (
      <img
        src="/images/didcomm-logo.png"
        alt="DIDComm Logo"
        className="h-14 w-16"
      />
    ),
  },
  {
    id: 'oid4vp',
    title: 'OpenID4VP',
    desc: 'Use OpenID for Verifiable Presentations.',
    icon: (
      <img
        src="/images/oid4vc_logo.png"
        alt="OpenID4VP Logo"
        className="h-10 w-30"
      />
    ),
  },
]

export const subOptionsMap = {
  didcomm: [
    {
      id: 'anoncreds',
      title: 'AnonCreds',
      desc: 'Privacy-preserving credentials issued over DIDComm.',
      tooltip:
        'AnonCreds enables privacy-preserving credentials using ZK proofs.',
    },
    {
      id: 'w3c',
      title: 'W3C VCDM',
      desc: 'W3C Verifiable Credentials compatible with DIDComm transport.',
      tooltip: 'W3C VCDM defines interoperable verifiable credentials.',
    },
  ],

  oid4vp: [
    {
      id: 'mdoc',
      title: 'ISO mdoc',
      desc: 'ISO/IEC 18013-5 mobile document format for OpenID4VP.',
      tooltip: 'ISO mdoc follows the ISO/IEC 18013-5 mobile identity standard.',
    },
    {
      id: 'sdjwt',
      title: 'SD-JWT VC',
      desc: 'Selective Disclosure JWT Verifiable Credential format for OpenID4VP.',
      tooltip:
        'SD-JWT VC supports selective disclosure using a JWT-based credential format.',
    },
  ],
}

export const didOptionsMap: Record<string, string[]> = {
  anoncreds: [
    'did:indy:bcovrin:testnet',
    'did:indy:indicio:demonet',
    'did:indy:indicio:mainnet',
    'did:indy:indicio:testnet',
  ],

  w3c: [
    'did:polygon:testnet',
    ...(MODE === 'PROD' ? ['did:polygon:mainnet'] : []),
    'did:key',
    'did:web',
  ],
  mdoc: ['did:key', 'did:web'],
  sdjwt: ['did:key', 'did:web'],
}
