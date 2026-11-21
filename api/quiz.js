const { validate } = require('./validate.js');
const questions = require('../mock/quiz.json');

module.exports = function handler(req, res) {
  const request = req.body || {};
  const passed = validate(questions, { type: request.type, count: request.count });

  if (!passed) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: '문항을 만들지 못했습니다. 다시 시도해 주세요.' }));
    return;
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ items: questions }));
};
