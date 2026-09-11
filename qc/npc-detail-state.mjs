// Isolated near-traffic candidate. No runtime import until visual/performance acceptance.
export function chooseDetailedCars(cars, eye, previous = new Set(), mobile = false) {
  if (![eye.x, eye.y, eye.z].every(Number.isFinite)) return new Set();
  const enter = 42, leave = 52, limit = mobile ? 1 : 2;
  return new Set(cars.map(car => {
    const distance = Math.hypot(car.x - eye.x, car.y - eye.y, (car.z || 0) - eye.z);
    const retained = previous.has(car.id);
    return {id: car.id, distance, eligible: distance <= (retained ? leave : enter), score: distance - (retained ? 5 : 0)};
  }).filter(row => row.eligible).sort((a, b) => a.score - b.score || a.id - b.id).slice(0, limit).map(row => row.id));
}

export function npcWheelPose(car, prior, wheelbase = 2.772, radius = .365) {
  // totalMoved comes from accepted path advancement, including blocked-step rollback.
  const travelled = Number.isFinite(car.totalMoved) ? Math.max(0, car.totalMoved) : 0;
  const distance = prior ? travelled - prior.travelled : 0;
  const yaw = prior ? ((car.heading - prior.heading + 540) % 360 - 180) * Math.PI / 180 : 0;
  const steer = distance > 1e-5 ? Math.max(-.65, Math.min(.65, Math.atan(wheelbase * yaw / distance))) : prior?.steer || 0;
  return {angle: travelled / radius % (2 * Math.PI), steer, travelled, heading: car.heading};
}
