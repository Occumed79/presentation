window.PRESENTATION_CONFIG = {
  mapboxToken: 'PASTE_MAPBOX_PUBLIC_TOKEN_HERE',
  mapStyle: 'mapbox://styles/mapbox/standard',
  autoAdvanceMs: 9000,
  flourishEmbedUrl: '',
  scenes: [
    {id:'national',kicker:'NATIONAL VIEW',title:'The injury landscape',body:'Start high. See the entire field before diving into the individual claims that are shaping the pattern.',camera:{center:[-98.6,38.4],zoom:3.1,pitch:42,bearing:-8,duration:4200},mode:'points',metric:'claims'},
    {id:'pressure',kicker:'SEVERITY',title:'Where the pressure rises',body:'Each tower is a claim location. Height responds to severity and cost, exposing concentration that a flat table hides.',camera:{center:[-101.2,36.7],zoom:4.15,pitch:63,bearing:18,duration:3600},mode:'columns',metric:'severity'},
    {id:'california',kicker:'DIVE IN',title:'From national trend to local signal',body:'The camera moves into California while the data remains alive in three dimensions.',camera:{center:[-119.55,36.55],zoom:6.15,pitch:68,bearing:-24,duration:4200},mode:'columns+points',metric:'cost'},
    {id:'connections',kicker:'RELATIONSHIPS',title:'See what connects the claims',body:'Arcs turn isolated records into relationships. In the real dataset these can represent employer, provider, site, referral, or any other link we choose.',camera:{center:[-108.2,37.2],zoom:4.7,pitch:58,bearing:34,duration:3800},mode:'arcs',metric:'lostDays'},
    {id:'flourish',kicker:'BREAKAWAY',title:'Leave the map when the story needs it',body:'This scene opens a Flourish visualization inside the same presentation, then returns to the spatial world.',camera:{center:[-98.6,38.4],zoom:3.4,pitch:30,bearing:0,duration:2600},mode:'flourish',metric:'claims'}
  ]
};
