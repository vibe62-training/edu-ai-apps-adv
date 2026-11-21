---
description: '입력 폼에 항목과 빈 값 검사를 추가한다'
---
`public/${input:feature}.html`(feature는 quiz 또는 activity)의 입력 폼에 "${input:field}" 항목을 추가한다. 기존 항목과 같은 `.field` 틀에 `data-field`, `data-label="${input:field}"`, 이름표, 고유한 `id`와 `name`을 가진 입력란을 넣고, 입력란의 형태는 [디자인 지침](../instructions/design.instructions.md)의 네 가지 중에서 고른다.
빈 값으로 제출하면 입력란 아래에 "${input:field}을(를) 입력하세요"가 나오고, 검사를 통과하면 결과 영역 목록에 "${input:field}"와 입력값이 나오게 한다. 입력란에 `required`를 붙이면 `public/js/form-check.js`와 `public/app.js`가 두 동작을 처리하므로, 그렇게 되지 않을 때만 두 파일을 고친다.
[spec.md](../../spec.md)의 입력 표와 디자인 지침의 항목 표에도 같은 항목을 추가하고, 브라우저에서 빈 값 제출과 정상 제출을 확인한 결과를 보고한다.
