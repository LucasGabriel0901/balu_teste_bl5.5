function ok(res, message, data = null, status = 200) {
  return res.status(status).json({ success: true, message, data });
}

function fail(res, message, status = 400, details = null) {
  return res.status(status).json({ success: false, message, details });
}

module.exports = { ok, fail };
