---
name: activity-validator
description: 학습활동 추천 JSON의 형식과 시간 조건을 검사한다
---

# 학습활동 추천 검사

학습활동 JSON 배열을 `api/validate.js`의 `validateActivities()`로 검사하고, 실패한 항목 번호와 이유를 표로 보고한다.
검사 기준은 [spec.md](../../../spec.md)의 학습활동 추천 수용 기준 3~6번이다. 활동과 코드는 고치지 않고 보고만 한다.

## 준비

- 활동 JSON 배열이 든 파일 경로를 확인한다. 활동을 채팅에 붙여 받았으면 프로젝트 밖 임시 폴더에 UTF-8 JSON 파일로 저장하고, 검사가 끝나면 지운다.
- 활동 시간(분)과 활동 형태(`상관없음`, `개별`, `짝`, `모둠`, `전체` 중 하나)를 확인한다. 사용자가 알려 주지 않았으면 묻는다. 배열을 보고 짐작해서 채우지 않는다.

## 실행

프로젝트 루트에서 아래 명령을 실행한다. 마지막 세 값은 파일 경로, 활동 시간, 활동 형태다.

```shell
node -e "const {validateActivities}=require('./api/validate.js');const [file,minutes,grouping]=process.argv.slice(1);const items=JSON.parse(require('fs').readFileSync(file,'utf8').replace(/^\uFEFF/,''));const request={minutes:Number(minutes),grouping};const ok=(list)=>{try{return validateActivities(list,request)===true}catch(error){return false}};const list=Array.isArray(items)?items:[];console.log(JSON.stringify({all:ok(items),count:list.length,failed:list.map((item,index)=>ok([item,item,item])?0:index+1).filter(Boolean)}))" 활동.json 20 상관없음
```

출력은 `{"all":false,"count":3,"failed":[2]}` 같은 한 줄이다.

- `all`: 배열 전체를 `validateActivities()`에 넣은 결과다. `true`면 통과다.
- `count`: 배열의 항목 수다.
- `failed`: 항목을 하나씩 검사했을 때 통과하지 못한 항목의 순서다. 첫 항목이 1이다. `validateActivities()`는 활동이 3개일 때만 통과하므로, 명령은 같은 항목을 3번 넣어 한 항목만 검사한다.

명령이 오류로 끝나면 결과를 짐작하지 않고 오류 내용을 그대로 보고한다.

## 이유 찾기

`validateActivities()`는 통과 여부만 알려 준다. `failed`에 든 항목을 아래 규칙과 대조해, 어긴 규칙을 모두 이유로 적는다.

| 어긴 규칙 | 이유로 적을 말 |
| --- | --- |
| 항목이 객체가 아니다 | 활동 형식이 아님 |
| `title`, `materials`, `check` 중 빈 값이 있다 (공백만 있는 값도 빈 값이다. 준비물이 필요 없으면 `materials`는 "없음"이어야 한다) | 활동명, 준비물, 확인 방법 중 비어 있는 것의 이름 |
| `minutes`가 정수가 아니거나 1보다 작다 | 소요 시간이 1 이상의 정수가 아님 |
| `minutes`가 요청한 활동 시간보다 크다 | 소요 시간이 활동 시간을 넘음 |
| `grouping`이 `개별`, `짝`, `모둠`, `전체` 중 하나가 아니다 | 활동 형태가 네 가지 중 하나가 아님 |
| 요청한 활동 형태가 `상관없음`이 아닌데 `grouping`이 그 값과 다르다 | 활동 형태가 요청과 다름 |
| `steps`가 배열이 아니거나 3단계보다 적거나 6단계보다 많다 | 진행 순서가 3~6단계가 아님 |
| `steps`에 빈 단계가 있다 | 빈 단계가 있음 |

- `count`가 3이 아니면 항목 번호를 "전체"로 하고 "활동이 3개가 아님"을 적는다.
- `failed`의 항목이 위 규칙 중 어느 것도 어기지 않았으면 이유를 지어내지 않고 "이유 확인 안 됨"이라고 적는다.

## 보고

첫 줄에 전체 결과(통과 또는 실패), 검사한 활동 수, 실패한 활동 수를 적는다.
실패가 없으면 "실패한 항목 없음"이라고 적고, 있으면 아래 형태의 표를 쓴다. 이유에는 실제 값을 함께 적는다.

| 항목 번호 | 이유 |
| --- | --- |
| 2 | 소요 시간이 활동 시간을 넘음 (요청 20분, 실제 30분) |
| 2 | 빈 단계가 있음 (2단계) |
| 전체 | 활동이 3개가 아님 (실제 4개) |

항목 번호는 배열에서의 순서다. 항목의 `number` 값이 순서와 다르면 괄호 안에 함께 적는다.
