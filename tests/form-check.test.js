const test = require('node:test');
const assert = require('node:assert/strict');

// public/js/form-check.js는 브라우저용 IIFE이며 globalThis.FormCheck를 등록한다.
require('../public/js/form-check.js');
const { checkFields } = globalThis.FormCheck;

// spec.md 기능 1 입력 중 검사 규칙이 있는 항목 (퀴즈)
function quizFields(overrides = {}) {
  const base = {
    학년: { name: 'grade', label: '학년', value: '중2', required: true },
    과목: { name: 'subject', label: '과목', value: '수학', required: true },
    '단원 또는 주제': { name: 'topic', label: '단원 또는 주제', value: '분수의 덧셈', required: true },
    '문항 수': { name: 'count', label: '문항 수', value: '5', required: true, min: 1, max: 20, unit: '개' },
    난이도: { name: 'level', label: '난이도', value: '보통', required: true },
  };
  return Object.values({ ...base, ...overrides });
}

// 학습활동 추천 입력 중 검사 규칙이 있는 항목
function activityFields(overrides = {}) {
  const base = {
    '활동 시간': { name: 'minutes', label: '활동 시간', value: '20', required: true, min: 1, max: 100, unit: '분' },
    '학생 수': { name: 'students', label: '학생 수', value: '', required: false, min: 1, max: 40, unit: '명' },
    '모둠 인원': { name: 'group', label: '모둠 인원', value: '4', required: true, min: 2, max: 6, unit: '명' },
  };
  return Object.values({ ...base, ...overrides });
}

function namesOf(results) {
  return results.map((result) => result.name);
}

test('입력 검사: 모든 항목이 맞으면 틀린 항목이 없다', async (t) => {
  await t.test('퀴즈 입력이 모두 맞으면 결과가 비어 있다', () => {
    assert.deepEqual(checkFields(quizFields()), []);
  });

  await t.test('학습활동 입력이 모두 맞으면 결과가 비어 있다 (선택 항목 비움 포함)', () => {
    assert.deepEqual(checkFields(activityFields()), []);
  });
});

test('입력 검사: 필수 항목이 비어 있거나 공백뿐이면 모두 알려준다', async (t) => {
  await t.test('빈 값과 공백만 있는 필수 항목을 각각 알려준다', () => {
    const fields = quizFields({
      과목: { name: 'subject', label: '과목', value: '', required: true },
      '단원 또는 주제': { name: 'topic', label: '단원 또는 주제', value: '   ', required: true },
    });
    assert.deepEqual(namesOf(checkFields(fields)), ['subject', 'topic']);
  });

  await t.test('값이 없는(undefined) 필수 항목도 알려준다', () => {
    const fields = quizFields({
      난이도: { name: 'level', label: '난이도', required: true },
    });
    assert.deepEqual(namesOf(checkFields(fields)), ['level']);
  });

  await t.test('틀린 항목이 여러 개면 하나도 빠짐없이 알려준다', () => {
    const fields = quizFields({
      학년: { name: 'grade', label: '학년', value: '', required: true },
      과목: { name: 'subject', label: '과목', value: '', required: true },
      '문항 수': { name: 'count', label: '문항 수', value: '0', required: true, min: 1, max: 20, unit: '개' },
    });
    assert.deepEqual(namesOf(checkFields(fields)), ['grade', 'subject', 'count']);
  });

  await t.test('알려주는 항목마다 고칠 내용을 담은 문장이 있다', () => {
    const results = checkFields(quizFields({ 과목: { name: 'subject', label: '과목', value: '', required: true } }));
    assert.equal(results.length, 1);
    assert.notEqual(results[0].message.trim(), '');
  });
});

test('입력 검사: 숫자 범위를 벗어나거나 숫자가 아니면 알려준다', async (t) => {
  await t.test('퀴즈 문항 수가 1~20 범위 밖이거나 숫자가 아니면 알려준다', () => {
    for (const value of ['0', '21', 'abc']) {
      const fields = quizFields({
        '문항 수': { name: 'count', label: '문항 수', value, required: true, min: 1, max: 20, unit: '개' },
      });
      assert.deepEqual(namesOf(checkFields(fields)), ['count'], `문항 수 ${value}`);
    }
  });

  await t.test('퀴즈 문항 수가 1과 20이면 통과한다 (경계값)', () => {
    for (const value of ['1', '20']) {
      const fields = quizFields({
        '문항 수': { name: 'count', label: '문항 수', value, required: true, min: 1, max: 20, unit: '개' },
      });
      assert.deepEqual(checkFields(fields), [], `문항 수 ${value}`);
    }
  });

  await t.test('학습활동 모둠 인원이 2~6 범위 밖이면 알려준다', () => {
    for (const value of ['1', '7']) {
      const fields = activityFields({
        '모둠 인원': { name: 'group', label: '모둠 인원', value, required: true, min: 2, max: 6, unit: '명' },
      });
      assert.deepEqual(namesOf(checkFields(fields)), ['group'], `모둠 인원 ${value}`);
    }
  });

  await t.test('학습활동 활동 시간이 1~100 범위 밖이면 알려준다', () => {
    for (const value of ['0', '101']) {
      const fields = activityFields({
        '활동 시간': { name: 'minutes', label: '활동 시간', value, required: true, min: 1, max: 100, unit: '분' },
      });
      assert.deepEqual(namesOf(checkFields(fields)), ['minutes'], `활동 시간 ${value}`);
    }
  });

  await t.test('학습활동 활동 시간이 정수가 아니면 알려준다 (수용 기준 1: 정수)', () => {
    const fields = activityFields({
      '활동 시간': { name: 'minutes', label: '활동 시간', value: '10.5', required: true, min: 1, max: 100, unit: '분' },
    });
    assert.deepEqual(namesOf(checkFields(fields)), ['minutes']);
  });
});

test('입력 검사: 글자 수 제한을 넘으면 알려주고 제한 글자 수까지는 통과한다', async (t) => {
  await t.test('과목 30자는 통과하고 31자는 알려준다', () => {
    const fieldWith = (value) => quizFields({
      과목: { name: 'subject', label: '과목', value, required: true, maxLength: 30 },
    });
    assert.deepEqual(checkFields(fieldWith('가'.repeat(30))), []);
    assert.deepEqual(namesOf(checkFields(fieldWith('가'.repeat(31)))), ['subject']);
  });

  await t.test('학습 목표 200자는 통과하고 201자는 알려준다', () => {
    const fieldWith = (value) => activityFields({
      '학습 목표': { name: 'goal', label: '학습 목표', value, required: true, maxLength: 200 },
    });
    assert.deepEqual(checkFields(fieldWith('가'.repeat(200))), []);
    assert.deepEqual(namesOf(checkFields(fieldWith('가'.repeat(201)))), ['goal']);
  });
});

test('입력 검사: 선택 항목은 비워 두어도 알려주지 않지만 채우면 범위를 검사한다', async (t) => {
  await t.test('학생 수를 비우면 틀린 항목이 아니다', () => {
    assert.deepEqual(checkFields(activityFields()), []);
  });

  await t.test('학생 수가 1~40 범위 밖이면 알려준다', () => {
    for (const value of ['0', '41']) {
      const fields = activityFields({
        '학생 수': { name: 'students', label: '학생 수', value, required: false, min: 1, max: 40, unit: '명' },
      });
      assert.deepEqual(namesOf(checkFields(fields)), ['students'], `학생 수 ${value}`);
    }
  });
});
