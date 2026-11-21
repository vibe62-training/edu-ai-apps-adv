---
name: quiz-validator
description: 퀴즈 문항 JSON의 형식과 정답 포함 여부를 검사한다
---

# 퀴즈 문항 검사

퀴즈 문항 JSON 배열을 `api/validate.js`의 `validate()`로 검사하고, 실패한 항목 번호와 이유를 표로 보고한다.
검사 기준은 [spec.md](../../../spec.md)의 퀴즈 생성기 수용 기준 3~5번이다. 문항과 코드는 고치지 않고 보고만 한다.

## 준비

- 문항 JSON 배열이 든 파일 경로를 확인한다. 문항을 채팅에 붙여 받았으면 프로젝트 밖 임시 폴더에 UTF-8 JSON 파일로 저장하고, 검사가 끝나면 지운다.
- 문항 유형(`선택형`, `OX`, `단답형` 중 하나)과 문항 수를 확인한다. 사용자가 알려 주지 않았으면 묻는다. 배열을 보고 짐작해서 채우지 않는다.

## 실행

프로젝트 루트에서 아래 명령을 실행한다. 마지막 세 값은 파일 경로, 문항 유형, 문항 수다.

```shell
node -e "const {validate}=require('./api/validate.js');const [file,type,count]=process.argv.slice(1);const items=JSON.parse(require('fs').readFileSync(file,'utf8').replace(/^\uFEFF/,''));const ok=(list,request)=>{try{return validate(list,request)===true}catch(error){return false}};const list=Array.isArray(items)?items:[];console.log(JSON.stringify({all:ok(items,{type,count:Number(count)}),count:list.length,failed:list.map((item,index)=>ok([item],{type,count:1})?0:index+1).filter(Boolean)}))" 문항.json 선택형 5
```

출력은 `{"all":false,"count":6,"failed":[2,4]}` 같은 한 줄이다.

- `all`: 배열 전체를 `validate()`에 넣은 결과다. `true`면 통과다.
- `count`: 배열의 항목 수다.
- `failed`: 항목을 하나씩 `validate()`에 넣었을 때 통과하지 못한 항목의 순서다. 첫 항목이 1이다.

명령이 오류로 끝나면 결과를 짐작하지 않고 오류 내용을 그대로 보고한다.

## 이유 찾기

`validate()`는 통과 여부만 알려 준다. `failed`에 든 항목을 아래 규칙과 대조해, 어긴 규칙을 모두 이유로 적는다.

| 어긴 규칙 | 이유로 적을 말 |
| --- | --- |
| 항목이 객체가 아니다 | 문항 형식이 아님 |
| `type`이 요청한 문항 유형과 다르다 | 유형이 요청과 다름 |
| `question`, `answer`, `explanation` 중 빈 값이 있다 (공백만 있는 값도 빈 값이다) | 문제, 정답, 해설 중 비어 있는 것의 이름 |
| 선택형인데 `choices`가 4개가 아니다 | 보기가 4개가 아님 |
| 선택형인데 `choices`에 같은 보기가 있다 | 같은 보기가 있음 |
| 선택형인데 `answer`가 `choices` 중 어느 것과도 글자가 같지 않다 | 정답이 보기에 없음 |
| OX인데 `answer`가 `O`도 `X`도 아니다 | 정답이 O 또는 X가 아님 |

- `count`가 요청한 문항 수와 다르면 항목 번호를 "전체"로 하고 "문항 수가 요청과 다름"을 적는다.
- `failed`의 항목이 위 규칙 중 어느 것도 어기지 않았으면 이유를 지어내지 않고 "이유 확인 안 됨"이라고 적는다.

## 보고

첫 줄에 전체 결과(통과 또는 실패), 검사한 문항 수, 실패한 문항 수를 적는다.
실패가 없으면 "실패한 항목 없음"이라고 적고, 있으면 아래 형태의 표를 쓴다. 이유에는 실제 값을 함께 적는다.

| 항목 번호 | 이유 |
| --- | --- |
| 2 | 같은 보기가 있음 ("응고"가 2개) |
| 4 | 정답이 보기에 없음 (정답 "승화") |
| 전체 | 문항 수가 요청과 다름 (요청 5개, 실제 6개) |

항목 번호는 배열에서의 순서다. 항목의 `number` 값이 순서와 다르면 괄호 안에 함께 적는다.
