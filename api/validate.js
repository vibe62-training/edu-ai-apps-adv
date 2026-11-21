const GROUPINGS = ['개별', '짝', '모둠', '전체'];
const ANY_GROUPING = '상관없음';

function isFilled(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function isValidQuestion(question, type) {
  if (!question || typeof question !== 'object') return false;
  if (question.type !== type) return false;
  if (!isFilled(question.question) || !isFilled(question.answer) || !isFilled(question.explanation)) return false;

  if (type === '선택형') {
    const choices = question.choices;
    if (!Array.isArray(choices) || choices.length !== 4) return false;
    if (!choices.every(isFilled)) return false;
    if (new Set(choices.map((choice) => choice.trim())).size !== 4) return false;
    if (!choices.includes(question.answer)) return false;
  }

  if (type === 'OX' && question.answer !== 'O' && question.answer !== 'X') return false;

  return true;
}

// response: AI가 돌려준 문항 목록, request: { type, count }
function validate(response, request) {
  const count = Number(request.count);
  if (!Array.isArray(response) || !Number.isInteger(count) || count < 1) return false;
  if (response.length !== count) return false;
  return response.every((question) => isValidQuestion(question, request.type));
}

function isValidActivity(activity, request) {
  if (!activity || typeof activity !== 'object') return false;
  if (!isFilled(activity.title) || !isFilled(activity.materials) || !isFilled(activity.check)) return false;

  const minutes = activity.minutes;
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > Number(request.minutes)) return false;

  if (!GROUPINGS.includes(activity.grouping)) return false;
  if (request.grouping !== ANY_GROUPING && activity.grouping !== request.grouping) return false;

  const steps = activity.steps;
  if (!Array.isArray(steps) || steps.length < 3 || steps.length > 6) return false;
  if (!steps.every(isFilled)) return false;

  return true;
}

// response: AI가 돌려준 활동 목록, request: { minutes, grouping }
function validateActivities(response, request) {
  const limit = Number(request.minutes);
  if (!Array.isArray(response) || response.length !== 3) return false;
  if (!Number.isInteger(limit) || limit < 1) return false;
  return response.every((activity) => isValidActivity(activity, request));
}

module.exports = { validate, validateActivities };
