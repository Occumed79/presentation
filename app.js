(function () {
  'use strict';

  const config = window.PRESENTATION_CONFIG || {};
  const state = {
    data: [],
    sceneIndex: 0,
    mode: 'story',
    map: null,
    deckOverlay: null,
    autoTimer: null,
    modelHotspots: []
  };

  const $ = (id) => document.getElementById(id);
  const els = {
    map: $('map'),
    scrim: $('scrim'),
    datasetName: $('datasetName'),
    sceneNumber: $('sceneNumber'),
    sceneTotal: $('sceneTotal'),
    sceneKicker: $('sceneKicker'),
    sceneTitle: $('sceneTitle'),
    sceneBody: $('sceneBody'),
    sceneMetric: $('sceneMetric'),
    sceneRail: $('sceneRail'),
    progressBar: $('progressBar'),
    prevBtn: $('prevBtn'),
    nextBtn: $('nextBtn'),
    autoBtn: $('autoBtn'),
    loadDataBtn: $('loadDataBtn'),
    fileInput: $('fileInput'),
    tokenGate: $('tokenGate'),
    status: $('status'),
    flourishPanel: $('flourishPanel'),
    flourishFrame: $('flourishFrame'),
    flourishEmpty: $('flourishEmpty'),
    closeFlourish: $('closeFlourish'),
    modelPanel: $('modelPanel'),
    modelViewer: $('clientModel'),
    modelEmpty: $('modelEmpty'),
    closeModel: $('closeModel'),
    modeStory: $('modeStory'),
    modeExplore: $('modeExplore'),
    explorePanel: $('explorePanel'),
    exploreMetric: $('exploreMetric'),
    exploreVisual: $('exploreVisual')
  };

  const scenes = Array.isArray(config.scenes) ? config.scenes : [];
  els.sceneTotal.textContent = String(scenes.length).padStart(2, '0');
  els.datasetName.textContent = config.experienceName || 'Reusable data experience';

  function notify(message) {
    els.status.textContent = message;
    els.status.classList.add('show');
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => els.status.classList.remove('show'), 2200);
  }

  function number(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function formatCompact(value) {
    const n = number(value);
    return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
  }

  function currency(value) {
    const n = number(value);
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(n);
  }

  function normalizeRecord(row, i) {
    const latitude = number(row.latitude ?? row.lat ?? row.Latitude ?? row.LATITUDE);
    const longitude = number(row.longitude ?? row.lon ?? row.lng ?? row.Longitude ?? row.LONGITUDE);
    return {
      ...row,
      id: row.id || row.ID || row.claim_id || 'R' + String(i + 1).padStart(4, '0'),
      latitude,
      longitude,
      severity: Math.max(0, number(row.severity ?? row.Severity ?? 1)),
      cost: Math.max(0, number(row.cost ?? row.Cost ?? row.total_cost ?? 0)),
      lost_days: Math.max(0, number(row.lost_days ?? row.lostDays ?? row.Lost_Days ?? 0)),
      agency: row.agency || row.client || row.employer || row.Agency || 'Unassigned'
    };
  }

  function validGeo(d) {
    return Math.abs(d.latitude) <= 90 && Math.abs(d.longitude) <= 180 && !(d.latitude === 0 && d.longitude === 0);
  }

  function setData(rows, name) {
    state.data = (rows || []).map(normalizeRecord).filter(validGeo);
    if (name) els.datasetName.textContent = name;
    notify(state.data.length + ' records loaded');
    if (state.map) renderForCurrentState();
    updateSceneMetrics();
  }

  async function loadDefaultData() {
    try {
      const res = await fetch('./data/injuries.json');
      if (!res.ok) throw new Error('data request failed');
      setData(await res.json(), config.experienceName || 'Demo injury dataset');
    } catch (err) {
      notify('Demo data could not be loaded');
    }
  }

  function parseUploadedFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (ext === 'json') {
          const parsed = JSON.parse(reader.result);
          setData(Array.isArray(parsed) ? parsed : parsed.data || [], file.name);
        } else {
          const parsed = Papa.parse(reader.result, { header: true, dynamicTyping: true, skipEmptyLines: true });
          setData(parsed.data, file.name);
        }
      } catch (err) {
        notify('Could not read that file');
      }
    };
    reader.readAsText(file);
  }

  function metricValue(metric, d) {
    if (metric === 'severity') return d.severity;
    if (metric === 'cost') return d.cost;
    if (metric === 'lostDays' || metric === 'lost_days') return d.lost_days;
    return 1;
  }

  function colorFor(d) {
    const s = Math.max(1, Math.min(5, d.severity || 1));
    const palette = [
      [74, 160, 255, 210],
      [64, 201, 183, 220],
      [244, 193, 74, 225],
      [244, 135, 74, 230],
      [235, 82, 96, 235]
    ];
    return palette[s - 1];
  }

  function pointLayer(data) {
    return new deck.ScatterplotLayer({
      id: 'claims-points',
      data,
      pickable: true,
      opacity: 0.9,
      radiusUnits: 'meters',
      getPosition: d => [d.longitude, d.latitude],
      getRadius: d => 18000 + d.severity * 4200,
      getFillColor: colorFor,
      getLineColor: [255, 255, 255, 150],
      lineWidthMinPixels: 1,
      stroked: true,
      onClick: info => {
        if (info.object) notify(info.object.id + ' · ' + info.object.agency);
      }
    });
  }

  function columnLayer(data, metric) {
    const values = data.map(d => metricValue(metric, d));
    const max = Math.max(...values, 1);
    return new deck.ColumnLayer({
      id: 'claims-columns',
      data,
      pickable: true,
      diskResolution: 24,
      radius: 13000,
      elevationScale: 1,
      extruded: true,
      getPosition: d => [d.longitude, d.latitude],
      getFillColor: colorFor,
      getLineColor: [255, 255, 255, 80],
      stroked: true,
      getElevation: d => {
        const v = metricValue(metric, d);
        return 18000 + (v / max) * 180000;
      },
      transitions: { getElevation: 900 },
      onClick: info => {
        if (info.object) notify(info.object.id + ' · ' + labelMetric(metric, metricValue(metric, info.object)));
      }
    });
  }

  function relationshipPairs(data) {
    const groups = {};
    data.forEach(d => {
      const key = d.agency || 'Unassigned';
      (groups[key] ||= []).push(d);
    });
    const pairs = [];
    Object.values(groups).forEach(group => {
      for (let i = 1; i < group.length; i++) pairs.push({ source: group[i - 1], target: group[i], agency: group[i].agency });
    });
    if (!pairs.length && data.length > 1) {
      for (let i = 1; i < data.length; i++) pairs.push({ source: data[i - 1], target: data[i] });
    }
    return pairs;
  }

  function arcLayer(data) {
    return new deck.ArcLayer({
      id: 'claim-arcs',
      data: relationshipPairs(data),
      pickable: true,
      getSourcePosition: d => [d.source.longitude, d.source.latitude],
      getTargetPosition: d => [d.target.longitude, d.target.latitude],
      getSourceColor: d => colorFor(d.source),
      getTargetColor: d => colorFor(d.target),
      getWidth: 3,
      widthMinPixels: 2,
      getHeight: 0.35,
      onClick: info => info.object && notify(info.object.agency || 'Relationship')
    });
  }

  function labelMetric(metric, value) {
    if (metric === 'cost') return currency(value);
    if (metric === 'lostDays' || metric === 'lost_days') return formatCompact(value) + ' days';
    if (metric === 'severity') return Number(value).toFixed(1) + ' severity';
    return formatCompact(value) + ' claims';
  }

  function buildLayers(visual, metric) {
    const data = state.data;
    if (visual === 'columns') return [columnLayer(data, metric)];
    if (visual === 'columns+points') return [columnLayer(data, metric), pointLayer(data)];
    if (visual === 'arcs') return [arcLayer(data), pointLayer(data)];
    return [pointLayer(data)];
  }

  function setDeckLayers(visual, metric) {
    if (!state.deckOverlay) return;
    state.deckOverlay.setProps({ layers: buildLayers(visual, metric) });
  }

  function renderForCurrentState() {
    if (state.mode === 'explore') {
      setDeckLayers(els.exploreVisual.value, els.exploreMetric.value);
      return;
    }
    const scene = scenes[state.sceneIndex];
    if (scene && scene.type === 'map') setDeckLayers(scene.visual || 'points', scene.metric || 'claims');
  }

  function initMap() {
    const token = config.mapboxToken || '';
    if (!token || token.includes('PASTE_MAPBOX')) {
      els.tokenGate.classList.add('open');
      return;
    }

    mapboxgl.accessToken = token;
    const firstMapScene = scenes.find(s => s.type === 'map') || {};
    const camera = firstMapScene.camera || { center: [-98.6, 38.4], zoom: 3, pitch: 35, bearing: 0 };

    state.map = new mapboxgl.Map({
      container: 'map',
      style: config.mapStyle || 'mapbox://styles/mapbox/standard',
      center: camera.center,
      zoom: camera.zoom,
      pitch: camera.pitch,
      bearing: camera.bearing,
      antialias: true,
      attributionControl: true
    });

    state.map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'bottom-right');

    state.map.on('style.load', () => {
      try {
        if (config.enableTerrain !== false) {
          state.map.addSource('cinema-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 14
          });
          state.map.setTerrain({ source: 'cinema-dem', exaggeration: config.terrainExaggeration || 1.15 });
        }
      } catch (e) {}
    });

    state.map.on('load', () => {
      state.deckOverlay = new deck.MapboxOverlay({ interleaved: true, layers: [] });
      state.map.addControl(state.deckOverlay);
      renderForCurrentState();
      setScene(0, false);
    });
  }

  function mapVisible(show) {
    els.map.style.opacity = show ? '1' : '0.12';
    els.scrim.style.opacity = show ? '1' : '0.25';
  }

  function closeSpecialPanels() {
    els.flourishPanel.classList.remove('open');
    els.flourishPanel.setAttribute('aria-hidden', 'true');
    els.modelPanel.classList.remove('open');
    els.modelPanel.setAttribute('aria-hidden', 'true');
  }

  function openFlourish(scene) {
    closeSpecialPanels();
    const url = scene.embedUrl || config.flourishEmbedUrl || '';
    if (url) {
      els.flourishFrame.src = url;
      els.flourishFrame.style.display = 'block';
      els.flourishEmpty.style.display = 'none';
    } else {
      els.flourishFrame.removeAttribute('src');
      els.flourishFrame.style.display = 'none';
      els.flourishEmpty.style.display = 'grid';
    }
    els.flourishPanel.classList.add('open');
    els.flourishPanel.setAttribute('aria-hidden', 'false');
  }

  function clearModelHotspots() {
    state.modelHotspots.forEach(el => el.remove());
    state.modelHotspots = [];
  }

  function addModelHotspots(scene) {
    clearModelHotspots();
    const spots = Array.isArray(scene.hotspots) ? scene.hotspots : [];
    spots.forEach((spot, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.slot = 'hotspot-' + i;
      button.className = 'model-hotspot';
      button.dataset.position = spot.position || '0m 0m 0m';
      if (spot.normal) button.dataset.normal = spot.normal;
      button.textContent = spot.label || String(i + 1);
      button.title = spot.detail || spot.label || 'Data point';
      button.addEventListener('click', () => notify(spot.detail || spot.label || 'Model data point'));
      els.modelViewer.appendChild(button);
      state.modelHotspots.push(button);
    });
  }

  function openModel(scene) {
    closeSpecialPanels();
    const modelUrl = scene.modelUrl || config.defaultModelUrl || '';
    els.modelViewer.setAttribute('environment-image', scene.environmentImage || 'neutral');
    els.modelViewer.setAttribute('shadow-intensity', '1');
    els.modelViewer.setAttribute('camera-controls', '');
    if (scene.autoRotate !== false) els.modelViewer.setAttribute('auto-rotate', '');
    else els.modelViewer.removeAttribute('auto-rotate');

    if (modelUrl) {
      els.modelViewer.src = modelUrl;
      els.modelViewer.style.display = 'block';
      els.modelEmpty.style.display = 'none';
      addModelHotspots(scene);
    } else {
      els.modelViewer.removeAttribute('src');
      els.modelViewer.style.display = 'none';
      els.modelEmpty.style.display = 'grid';
      clearModelHotspots();
    }
    els.modelPanel.classList.add('open');
    els.modelPanel.setAttribute('aria-hidden', 'false');
  }

  function sceneMetrics(metric) {
    const data = state.data;
    const claims = data.length;
    const totalCost = data.reduce((s, d) => s + d.cost, 0);
    const lost = data.reduce((s, d) => s + d.lost_days, 0);
    const avgSeverity = claims ? data.reduce((s, d) => s + d.severity, 0) / claims : 0;

    if (metric === 'cost') return [
      [currency(totalCost), 'total cost'],
      [formatCompact(claims), 'records'],
      [formatCompact(lost), 'lost days']
    ];
    if (metric === 'severity') return [
      [avgSeverity.toFixed(1), 'avg severity'],
      [formatCompact(claims), 'records'],
      [formatCompact(lost), 'lost days']
    ];
    if (metric === 'lostDays' || metric === 'lost_days') return [
      [formatCompact(lost), 'lost days'],
      [formatCompact(claims), 'records'],
      [currency(totalCost), 'total cost']
    ];
    return [
      [formatCompact(claims), 'records'],
      [currency(totalCost), 'total cost'],
      [formatCompact(lost), 'lost days']
    ];
  }

  function updateSceneMetrics() {
    const scene = scenes[state.sceneIndex] || {};
    els.sceneMetric.innerHTML = '';
    sceneMetrics(scene.metric || 'claims').forEach(([value, label]) => {
      const div = document.createElement('div');
      div.className = 'metric';
      div.innerHTML = '<strong>' + value + '</strong><span>' + label + '</span>';
      els.sceneMetric.appendChild(div);
    });
  }

  function updateStoryText(scene, index) {
    els.sceneNumber.textContent = String(index + 1).padStart(2, '0');
    els.sceneKicker.textContent = scene.kicker || 'SCENE';
    els.sceneTitle.textContent = scene.title || '';
    els.sceneBody.textContent = scene.body || '';
    els.progressBar.style.width = (((index + 1) / Math.max(scenes.length, 1)) * 100) + '%';
    [...els.sceneRail.children].forEach((el, i) => el.classList.toggle('active', i === index));
    updateSceneMetrics();
  }

  function setScene(index, animate = true) {
    if (!scenes.length) return;
    state.sceneIndex = Math.max(0, Math.min(scenes.length - 1, index));
    const scene = scenes[state.sceneIndex];
    updateStoryText(scene, state.sceneIndex);
    closeSpecialPanels();

    if (scene.type === 'model') {
      mapVisible(false);
      openModel(scene);
      if (state.deckOverlay) state.deckOverlay.setProps({ layers: [] });
      return;
    }

    if (scene.type === 'flourish') {
      mapVisible(false);
      openFlourish(scene);
      if (state.deckOverlay) state.deckOverlay.setProps({ layers: [] });
      return;
    }

    mapVisible(true);
    if (state.map && scene.camera) {
      const opts = { ...scene.camera };
      if (!animate) opts.duration = 0;
      state.map[scene.animation || 'flyTo'](opts);
    }
    setDeckLayers(scene.visual || 'points', scene.metric || 'claims');
  }

  function buildSceneRail() {
    els.sceneRail.innerHTML = '';
    scenes.forEach((scene, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'scene-dot' + (i === 0 ? ' active' : '');
      btn.title = scene.title || 'Scene ' + (i + 1);
      btn.setAttribute('aria-label', btn.title);
      btn.addEventListener('click', () => setScene(i));
      els.sceneRail.appendChild(btn);
    });
  }

  function stopAuto() {
    if (state.autoTimer) clearInterval(state.autoTimer);
    state.autoTimer = null;
    els.autoBtn.textContent = 'Auto tour';
  }

  function toggleAuto() {
    if (state.autoTimer) {
      stopAuto();
      return;
    }
    setMode('story');
    els.autoBtn.textContent = 'Stop tour';
    state.autoTimer = setInterval(() => {
      const next = (state.sceneIndex + 1) % scenes.length;
      setScene(next);
    }, Math.max(3500, config.autoAdvanceMs || 9000));
  }

  function setMode(mode) {
    state.mode = mode;
    const explore = mode === 'explore';
    els.modeStory.classList.toggle('active', !explore);
    els.modeExplore.classList.toggle('active', explore);
    els.explorePanel.classList.toggle('open', explore);
    document.body.classList.toggle('explore-mode', explore);
    stopAuto();
    closeSpecialPanels();

    if (explore) {
      mapVisible(true);
      if (state.map) {
        state.map.easeTo({ pitch: 55, bearing: 0, duration: 1200 });
        setDeckLayers(els.exploreVisual.value, els.exploreMetric.value);
      }
      notify('Explore mode · free navigation');
    } else {
      setScene(state.sceneIndex);
    }
  }

  els.prevBtn.addEventListener('click', () => setScene(state.sceneIndex - 1));
  els.nextBtn.addEventListener('click', () => setScene(state.sceneIndex + 1));
  els.autoBtn.addEventListener('click', toggleAuto);
  els.loadDataBtn.addEventListener('click', () => els.fileInput.click());
  els.fileInput.addEventListener('change', e => {
    const file = e.target.files && e.target.files[0];
    if (file) parseUploadedFile(file);
    e.target.value = '';
  });
  els.closeFlourish.addEventListener('click', () => {
    els.flourishPanel.classList.remove('open');
    mapVisible(true);
  });
  els.closeModel.addEventListener('click', () => {
    els.modelPanel.classList.remove('open');
    mapVisible(true);
  });
  els.modeStory.addEventListener('click', () => setMode('story'));
  els.modeExplore.addEventListener('click', () => setMode('explore'));
  els.exploreMetric.addEventListener('change', renderForCurrentState);
  els.exploreVisual.addEventListener('change', renderForCurrentState);

  window.addEventListener('keydown', e => {
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') setScene(state.sceneIndex + 1);
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') setScene(state.sceneIndex - 1);
    if (e.key.toLowerCase() === 'e') setMode(state.mode === 'explore' ? 'story' : 'explore');
    if (e.key === 'Escape') closeSpecialPanels();
  });

  buildSceneRail();
  updateStoryText(scenes[0] || {}, 0);
  loadDefaultData();
  initMap();
})();
