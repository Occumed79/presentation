# Occu-Med Data Cinema

Reusable cinematic data-presentation shell for conference-room presentations, prospects, and client-specific stories.

## What is already wired

- **Story mode** — guided scene sequence with cinematic Mapbox camera movement.
- **Explore mode** — free navigation with metric and visualization controls.
- **Mapbox** — 3-D map / terrain / camera stage.
- **deck.gl** — points, 3-D towers, and relationship arcs over the map.
- **3-D model stage** — powered by Google `<model-viewer>`; accepts GLB/GLTF models without changing the app engine.
- **Flourish stage** — embed a Flourish visualization as a non-geographic scene.
- **CSV / JSON loader** — replace the demo records from the UI.
- **Config-driven scenes** — camera, visual type, metric, model, and embed behavior live in `config.js`.

## One-time Mapbox setup

Open `config.js` and replace:

```js
mapboxToken: 'PASTE_MAPBOX_PUBLIC_TOKEN_HERE'
```

with a Mapbox public token.

## Data

The demo dataset is in:

```
data/injuries.json
```

A blank import template is in:

```
data/template.csv
```

The engine recognizes these geographic column names automatically:

- `latitude` / `lat`
- `longitude` / `lon` / `lng`

For the demo metrics it also understands:

- `severity`
- `cost`
- `lost_days`
- `agency` / `client` / `employer`

Extra columns can stay in the dataset; they are preserved for future scene types.

## Client-specific 3-D environments

Put a GLB/GLTF model in `assets/models/` and point a `model` scene at it:

```js
{
  id: 'client-environment',
  type: 'model',
  modelUrl: './assets/models/client-model.glb',
  autoRotate: true,
  hotspots: [
    {
      position: '0m 1m 0m',
      normal: '0m 1m 0m',
      label: '42 claims',
      detail: 'Deck operations'
    }
  ]
}
```

The model can be a ship, oil rig, aircraft, facility, machine, anatomy model, product, or anything else that fits the client story. The presentation engine does not need to change.

## Flourish scenes

Set either the global `flourishEmbedUrl` or a scene-specific `embedUrl` in `config.js`.

## Controls

- **Story / Explore** buttons switch modes.
- **Left / Right Arrow** moves between story scenes.
- **E** switches Story ↔ Explore.
- **Auto tour** advances scenes automatically.
- **Load CSV / JSON** replaces the demo dataset without changing code.

## Architecture rule

New client work should be treated as a **client pack**, not a new application:

1. data
2. scene configuration
3. optional GLB/GLTF model
4. optional Flourish embed
5. branding/content

The core presentation engine remains reusable.
