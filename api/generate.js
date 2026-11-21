const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const { validate, validateActivities } = require('./validate.js');

const SYSTEM_PROMPT = fs.readFileSync(path.join(__dirname, '시스템 프롬프트.txt'), 'utf8');

function buildQuizMessage(input) {
  const lines = [
    'type: quiz',
    `학년: ${input.grade}`,
    `과목: ${input.subject}`,
    `단원 또는 주제: ${input.topic}`,
    `문항 유형: ${input.questionType}`,
    `문항 수: ${input.count}`,
    `난이도: ${input.difficulty}`,
  ];
  if (input.reference) {
    lines.push('참고 자료:', input.reference, '참고 자료에 있는 내용으로만 출제한다.');
  }
  return lines.join('\n');
}

function buildActivityMessage(input) {
  const lines = [
    'type: activity',
    `학년: ${input.grade}`,
    `과목: ${input.subject}`,
    `학습 목표: ${input.goal}`,
    `활동 시간: ${input.minutes}분`,
    `활동 형태: ${input.grouping}`,
    `모둠 인원: ${input.groupSize}명`,
  ];
  if (input.students) lines.push(`학생 수: ${input.students}명`);
  if (input.materials) {
    lines.push(`쓸 수 있는 준비물: ${input.materials}`, '입력한 준비물만 쓴다.');
  }
  return lines.join('\n');
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

async function requestItems(message) {
  const endpoint = process.env.AI_ENDPOINT;
  const apiKey = process.env.AI_API_KEY;
  const deployment = process.env.AI_DEPLOYMENT;
  if (!endpoint || !apiKey || !deployment) throw new Error('AI 설정이 없습니다.');

  const client = new OpenAI({ apiKey, baseURL: endpoint });
  const completion = await client.chat.completions.create({
    model: deployment,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: message },
    ],
  });
  return JSON.parse(completion.choices[0].message.content);
}

module.exports = async function handler(req, res) {
  const { type, input } = req.body || {};
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: '허용되지 않는 요청입니다.' });
    return;
  }
  if ((type !== 'quiz' && type !== 'activity') || !input || typeof input !== 'object') {
    sendJson(res, 400, { error: '요청 형식이 올바르지 않습니다.' });
    return;
  }

  try {
    if (type === 'quiz') {
      const items = await requestItems(buildQuizMessage(input));
      const passed = validate(items, { type: input.questionType, count: input.count });
      if (!passed) throw new Error('응답 검사 실패');
      sendJson(res, 200, { items });
      return;
    }

    const items = await requestItems(buildActivityMessage(input));
    const passed = validateActivities(items, { minutes: input.minutes, grouping: input.grouping });
    if (!passed) throw new Error('응답 검사 실패');
    sendJson(res, 200, { items });
  } catch (error) {
    sendJson(res, 502, { error: type === 'quiz' ? '문항을 만들지 못했습니다. 다시 시도해 주세요.' : '활동을 추천하지 못했습니다. 다시 시도해 주세요.' });
  }
};
