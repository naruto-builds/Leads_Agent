export function getHealth(_req, res) {
  res.json({ status: 'ok', uptime_s: Math.round(process.uptime()) });
}