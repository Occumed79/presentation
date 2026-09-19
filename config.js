window.PRESENTATION_CONFIG = {
  experienceName: 'Demo injury dataset',
  mapboxToken: 'PASTE_MAPBOX_PUBLIC_TOKEN_HERE',
  mapStyle: 'mapbox://styles/mapbox/standard',
  enableTerrain: true,
  terrainExaggeration: 1.15,
  autoAdvanceMs: 9000,

  // Reusable scene adapters:
  // type: 'map'      -> Mapbox + deck.gl
  // type: 'model'    -> Google model-viewer; use any GLB/GLTF asset
  // type: 'flourish' -> embed a Flourish story/visual
  defaultModelUrl: '',
  flourishEmbedUrl: '',

  scenes: [
    {
      id:'national',
      type:'map',
      kicker:'NATIONAL VIEW',
      title:'The injury landscape',
      body:'Start high. See the entire field before diving into the records that are shaping the pattern.',
      camera:{center:[-98.6,38.4],zoom:3.1,pitch:42,bearing:-8,duration:4200},
      visual:'points',
      metric:'claims'
    },
    {
      id:'pressure',
      type:'map',
      kicker:'SEVERITY',
      title:'Where the pressure rises',
      body:'Each tower is a record location. Height can respond to severity, cost, lost time, or another metric from the uploaded dataset.',
      camera:{center:[-101.2,36.7],zoom:4.15,pitch:63,bearing:18,duration:3600},
      visual:'columns',
      metric:'severity'
    },
    {
      id:'local',
      type:'map',
      kicker:'DIVE IN',
      title:'From national trend to local signal',
      body:'The camera can move into any client, agency, facility, state, country, or individual cluster while the data remains alive in three dimensions.',
      camera:{center:[-119.55,36.55],zoom:6.15,pitch:68,bearing:-24,duration:4200},
      visual:'columns+points',
      metric:'cost'
    },
    {
      id:'relationships',
      type:'map',
      kicker:'RELATIONSHIPS',
      title:'See what connects the records',
      body:'Arcs can represent employer, facility, provider, referral, contract, movement, or any relationship defined in the data.',
      camera:{center:[-108.2,37.2],zoom:4.7,pitch:58,bearing:34,duration:3800},
      visual:'arcs',
      metric:'lostDays'
    },
    {
      id:'client-environment',
      type:'model',
      kicker:'CLIENT WORLD',
      title:'The data can leave the map entirely',
      body:'Use a client-specific 3-D object or environment without changing the presentation engine. A ship, oil rig, aircraft, facility, machine, body system, or any GLB/GLTF model can become the stage.',
      modelUrl:'',
      autoRotate:true,
      metric:'claims',
      hotspots:[
        // Example when a real model is added:
        // { position:'0m 1m 0m', normal:'0m 1m 0m', label:'42 claims', detail:'Deck operations' }
      ]
    },
    {
      id:'flourish',
      type:'flourish',
      kicker:'DATA BREAKAWAY',
      title:'Not every insight belongs on geography',
      body:'Drop in a Flourish visual for trends, distributions, networks, rankings, timelines, or another non-geographic story, then return to the 3-D world.',
      embedUrl:'',
      metric:'claims'
    }
  ]
};
