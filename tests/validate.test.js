const test = require('node:test');
const assert = require('node:assert/strict');
const { validate, validateActivities } = require('../api/validate.js');

// 두 함수의 약속 (spec.md의 응답 검사)
// validate(response, request): 통과하면 true, 아니면 false
//   response: [{ number, type, question, choices, answer, explanation }]
//   request: { type: '선택형' | 'OX' | '단답형', count }
// validateActivities(response, request): 통과하면 true, 아니면 false
//   response: [{ number, title, grouping, minutes, materials, steps, check }]
//   request: { minutes, grouping: '상관없음' | '개별' | '짝' | '모둠' | '전체' }

function list(count, make) {
  return Array.from({ length: count }, (_, index) => make(index + 1));
}

// 2번 항목만 changes로 바꾼 목록
function listWith(count, make, changes) {
  return list(count, (number) => make(number, number === 2 ? changes : {}));
}

function choiceQuestion(number, changes = {}) {
  return {
    number,
    type: '선택형',
    question: `${number}번 문제`,
    choices: [`${number}-가`, `${number}-나`, `${number}-다`, `${number}-라`],
    answer: `${number}-나`,
    explanation: `${number}번 해설`,
    ...changes,
  };
}

function oxQuestion(number, changes = {}) {
  return {
    number,
    type: 'OX',
    question: `${number}번 문제`,
    choices: [],
    answer: number % 2 === 0 ? 'X' : 'O',
    explanation: `${number}번 해설`,
    ...changes,
  };
}

function shortQuestion(number, changes = {}) {
  return {
    number,
    type: '단답형',
    question: `${number}번 문제`,
    choices: [],
    answer: `${number}번 정답`,
    explanation: `${number}번 해설`,
    ...changes,
  };
}

function activity(number, changes = {}) {
  return {
    number,
    title: `활동 ${number}`,
    grouping: '모둠',
    minutes: 15,
    materials: '포스트잇',
    steps: ['활동 방법을 안내한다.', '모둠별로 의견을 적는다.', '모둠 결과를 발표한다.'],
    check: '핵심 개념을 자기 말로 설명할 수 있는가?',
    ...changes,
  };
}

function steps(count) {
  return list(count, (number) => `${number}단계를 진행한다.`);
}

test('퀴즈: validate()는 수용 기준 3~5를 만족하는 응답만 통과시킨다', async (t) => {
  const choiceInput = { type: '선택형', count: 5 };
  const oxInput = { type: 'OX', count: 3 };
  const shortInput = { type: '단답형', count: 3 };

  await t.test('퀴즈 3: 문항 수가 입력한 문항 수와 같으면 통과한다', () => {
    assert.equal(validate(list(5, choiceQuestion), choiceInput), true);
  });

  await t.test('퀴즈 3: 문항 수가 입력한 문항 수와 다르면 통과하지 못한다', () => {
    for (const count of [0, 4, 6]) {
      assert.equal(validate(list(count, choiceQuestion), choiceInput), false, `문항 ${count}개`);
    }
  });

  await t.test('퀴즈 4: 문제, 정답, 해설이 모두 있고 유형이 같으면 통과한다', () => {
    assert.equal(validate(list(3, shortQuestion), shortInput), true);
  });

  await t.test('퀴즈 4: 문제, 정답, 해설 중 하나라도 빈 값이면 통과하지 못한다', () => {
    for (const key of ['question', 'answer', 'explanation']) {
      for (const empty of ['', '   ']) {
        const questions = listWith(3, shortQuestion, { [key]: empty });
        assert.equal(validate(questions, shortInput), false, `${key}: ${JSON.stringify(empty)}`);
      }
    }
  });

  await t.test('퀴즈 4: 유형이 입력한 문항 유형과 다른 문항이 있으면 통과하지 못한다', () => {
    const questions = list(3, (number) => (number === 2 ? oxQuestion(number) : shortQuestion(number)));
    assert.equal(validate(questions, shortInput), false);
  });

  await t.test('퀴즈 5: 선택형 문항의 보기가 4개가 아니면 통과하지 못한다', () => {
    const three = listWith(5, choiceQuestion, { choices: ['2-가', '2-나', '2-다'] });
    const five = listWith(5, choiceQuestion, { choices: ['2-가', '2-나', '2-다', '2-라', '2-마'] });
    assert.equal(validate(three, choiceInput), false, '보기 3개');
    assert.equal(validate(five, choiceInput), false, '보기 5개');
  });

  await t.test('퀴즈 5: 선택형 문항에 같은 보기가 있으면 통과하지 못한다', () => {
    const questions = listWith(5, choiceQuestion, { choices: ['2-가', '2-나', '2-나', '2-라'] });
    assert.equal(validate(questions, choiceInput), false);
  });

  await t.test('퀴즈 5: 선택형 문항의 정답이 보기에 없으면 통과하지 못한다', () => {
    const questions = listWith(5, choiceQuestion, { answer: '2-마' });
    assert.equal(validate(questions, choiceInput), false);
  });

  await t.test('퀴즈 5: OX 문항의 정답이 O 또는 X이면 통과한다', () => {
    assert.equal(validate(list(3, oxQuestion), oxInput), true);
  });

  await t.test('퀴즈 5: OX 문항의 정답이 O도 X도 아니면 통과하지 못한다', () => {
    const questions = listWith(3, oxQuestion, { answer: '맞다' });
    assert.equal(validate(questions, oxInput), false);
  });
});

test('학습활동: validateActivities()는 수용 기준 3~6을 만족하는 응답만 통과시킨다', async (t) => {
  const input = { minutes: 20, grouping: '상관없음' };

  await t.test('활동 3: 활동이 정확히 3개이면 통과한다', () => {
    assert.equal(validateActivities(list(3, activity), input), true);
  });

  await t.test('활동 3: 활동이 3개가 아니면 통과하지 못한다', () => {
    for (const count of [0, 2, 4]) {
      assert.equal(validateActivities(list(count, activity), input), false, `활동 ${count}개`);
    }
  });

  await t.test('활동 3: 활동명, 준비물, 확인 방법 중 하나라도 빈 값이면 통과하지 못한다', () => {
    for (const key of ['title', 'materials', 'check']) {
      for (const empty of ['', '   ']) {
        const activities = listWith(3, activity, { [key]: empty });
        assert.equal(validateActivities(activities, input), false, `${key}: ${JSON.stringify(empty)}`);
      }
    }
  });

  await t.test('활동 3: 준비물이 "없음"인 활동은 통과한다', () => {
    const activities = listWith(3, activity, { materials: '없음' });
    assert.equal(validateActivities(activities, input), true);
  });

  await t.test('활동 4: 소요 시간이 1 이상이고 입력한 활동 시간 이하인 정수이면 통과한다', () => {
    for (const minutes of [1, 20]) {
      const activities = listWith(3, activity, { minutes });
      assert.equal(validateActivities(activities, input), true, `소요 시간 ${minutes}분`);
    }
  });

  await t.test('활동 4: 소요 시간이 범위를 벗어나거나 정수가 아니면 통과하지 못한다', () => {
    for (const minutes of [0, 21, 10.5]) {
      const activities = listWith(3, activity, { minutes });
      assert.equal(validateActivities(activities, input), false, `소요 시간 ${minutes}분`);
    }
  });

  await t.test('활동 5: 활동 형태가 개별, 짝, 모둠, 전체 중 하나이면 통과한다', () => {
    for (const grouping of ['개별', '짝', '모둠', '전체']) {
      const activities = listWith(3, activity, { grouping });
      assert.equal(validateActivities(activities, input), true, `활동 형태 ${grouping}`);
    }
  });

  await t.test('활동 5: 활동 형태가 네 가지가 아니면 통과하지 못한다', () => {
    for (const grouping of ['상관없음', '자유', '']) {
      const activities = listWith(3, activity, { grouping });
      assert.equal(validateActivities(activities, input), false, `활동 형태 ${JSON.stringify(grouping)}`);
    }
  });

  await t.test('활동 5: 활동 형태를 골랐으면 3개 활동이 모두 그 형태여야 통과한다', () => {
    const pairInput = { minutes: 20, grouping: '짝' };
    const allPair = list(3, (number) => activity(number, { grouping: '짝' }));
    const onePairMissing = listWith(3, (number, changes) => activity(number, { grouping: '짝', ...changes }), { grouping: '모둠' });
    assert.equal(validateActivities(allPair, pairInput), true, '3개 모두 짝');
    assert.equal(validateActivities(onePairMissing, pairInput), false, '1개가 모둠');
  });

  await t.test('활동 6: 진행 순서가 3단계 이상 6단계 이하이면 통과한다', () => {
    for (const count of [3, 6]) {
      const activities = listWith(3, activity, { steps: steps(count) });
      assert.equal(validateActivities(activities, input), true, `${count}단계`);
    }
  });

  await t.test('활동 6: 진행 순서가 2단계 이하이거나 7단계 이상이면 통과하지 못한다', () => {
    for (const count of [0, 2, 7]) {
      const activities = listWith(3, activity, { steps: steps(count) });
      assert.equal(validateActivities(activities, input), false, `${count}단계`);
    }
  });

  await t.test('활동 6: 빈 단계가 있으면 통과하지 못한다', () => {
    for (const empty of ['', '   ']) {
      const activities = listWith(3, activity, { steps: ['활동 방법을 안내한다.', empty, '결과를 발표한다.'] });
      assert.equal(validateActivities(activities, input), false, `단계: ${JSON.stringify(empty)}`);
    }
  });
});
