const { validateActivities } = require('./validate.js');
const activities = require('../mock/activities.json');

module.exports = function handler(req, res) {
  const request = req.body || {};
  const passed = validateActivities(activities, { minutes: request.minutes, grouping: request.grouping });

  if (!passed) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: '활동을 추천하지 못했습니다. 다시 시도해 주세요.' }));
    return;
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ items: activities }));
};
