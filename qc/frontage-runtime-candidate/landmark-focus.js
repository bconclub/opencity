// Review candidate. Keep surveyed/source properties separate from displayed geometry.
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const finite = value => typeof value === 'number' && Number.isFinite(value);

export function buildFocusTargets(features, xy, model = {}, visibleFeatures = null) {
  const overrides = model.displayParts || {};
  const targets = [];
  features.forEach((feature, index) => {
    if (visibleFeatures && !visibleFeatures.has(feature)) return;
    const properties = feature.properties;
    const override = own(overrides, properties.osm_id) ? overrides[properties.osm_id] : undefined;
    if (override === null || override?.visible === false) return;
    const sourceTop = Number(properties.height ?? properties.render_height) || 8;
    const sourceBase = Number(properties.min_height ?? properties.render_min_height) || 0;
    const validOverride = override && finite(override.base) && finite(override.height)
      && override.base >= 0 && override.height >= override.base;
    const height = validOverride ? override.height : sourceTop;
    const base = validOverride ? override.base : sourceBase >= 0 && sourceBase < sourceTop ? sourceBase : 0;
    targets.push({
      id: 'building-' + index,
      properties,
      rings: feature.geometry.coordinates.map(ring => ring.map(xy)),
      name: properties.name || properties.site || 'Unnamed mapped building',
      base, height,
      source: validOverride ? 'OpenStreetMap footprint · reconstructed model' : 'OpenStreetMap',
      note: validOverride ? 'Displayed geometry height; architectural details are reconstructed.' : 'Model height is schematic',
    });
  });
  for (const extra of model.extraFocusTargets || []) {
    if (!extra.id || targets.some(target => target.id === extra.id)
      || !finite(extra.base) || !finite(extra.height) || extra.base < 0 || extra.height < extra.base
      || !Array.isArray(extra.rings) || !extra.rings.length
      || !extra.rings.every(ring => Array.isArray(ring) && ring.length >= 3
        && ring.every(point => Array.isArray(point) && point.length === 2 && point.every(finite)))) continue;
    targets.push({ ...extra, rings: extra.rings.map(ring => ring.map(point => [...point])),
      source: extra.source || 'Reconstructed model', note: extra.note || 'Estimated architectural geometry' });
  }
  return targets;
}

export function findFocusTarget(targets, point, z, inPoly, area) {
  if (!finite(z)) return null;
  let best = null, smallest = Infinity;
  for (const target of targets) {
    if (z < target.base - 1 || z > target.height + 2 || !inPoly(point, target.rings)) continue;
    const size = Math.abs(area(target.rings[0]));
    if (size < smallest) { best = target; smallest = size; }
  }
  return best;
}
