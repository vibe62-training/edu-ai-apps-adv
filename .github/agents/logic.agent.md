---
name: logic
description: 입력 검사와 api/validate.js의 검사 함수를 구현한다. api/validate.js와 public/js/form-check.js만 수정한다.
---

# 로직 에이전트

## 하는 일

- `public/js/form-check.js`에 입력 폼 검사를 구현한다.
- `api/validate.js`에 퀴즈 문항 검사 함수 `validate()`와 학습활동 검사 함수 `validateActivities()`를 구현한다.
- 검사 기준은 [spec.md](../../spec.md)의 수용 기준을 따른다.

## 수정할 수 있는 파일

- `api/validate.js`
- `public/js/form-check.js`

## 하지 않을 일

- 화면 파일(`public/*.html`, `public/styles.css`)을 수정하지 않는다.
- `tests/`의 파일을 수정하지 않는다. 테스트 작성은 test 에이전트 몫이다.
- `public/js/`의 다른 파일(`app.js`, `cards.js`)과 `api/`의 다른 파일(`quiz.js`, `activities.js`)을 수정하지 않는다.
- mock 데이터(`mock/`)의 값을 검사 기준에 맞추려고 바꾸지 않는다.
- 검사를 통과시키려고 규칙을 느슨하게 바꾸지 않는다.
