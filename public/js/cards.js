(function () {
  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function buildDetail(term, value) {
    return [createElement('dt', '', term), createElement('dd', '', value)];
  }

  function buildQuizCard(question) {
    const tags = createElement('div', 'card-tags');
    tags.append(createElement('span', 'card-tag', question.type));

    const head = createElement('header', 'card-head');
    head.append(
      createElement('span', 'card-number', `${question.number}번`),
      createElement('h3', 'card-title', question.question),
      tags
    );

    const choiceList = createElement('ol');
    for (const choice of question.choices) {
      choiceList.append(createElement('li', '', choice));
    }
    const body = createElement('dl', 'card-body');
    body.append(createElement('dt', '', '보기'), createElement('dd'));
    body.querySelector('dd').append(choiceList);

    const answerId = `answer-${question.number}`;
    const answer = createElement('dl', 'card-body card-answer');
    answer.id = answerId;
    answer.hidden = true;
    answer.append(...buildDetail('정답', question.answer), ...buildDetail('해설', question.explanation));

    const toggle = createElement('button', 'button button--secondary card-reveal', '정답·해설 보기');
    toggle.type = 'button';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', answerId);
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      toggle.textContent = expanded ? '정답·해설 보기' : '정답·해설 숨기기';
      answer.hidden = expanded;
    });

    const card = createElement('article', 'card');
    card.append(head, body, toggle, answer);
    return card;
  }

  function buildActivityCard(activity) {
    const head = createElement('header', 'card-head');
    const tags = createElement('div', 'card-tags');
    tags.append(
      createElement('span', 'card-tag', activity.grouping),
      createElement('span', 'card-tag', `${activity.minutes}분`)
    );
    head.append(
      createElement('span', 'card-number', `활동 ${activity.number}`),
      createElement('h3', 'card-title', activity.title),
      tags
    );

    const steps = createElement('ol');
    for (const step of activity.steps) {
      steps.append(createElement('li', '', step));
    }
    const stepsValue = createElement('dd');
    stepsValue.append(steps);

    const body = createElement('dl', 'card-body');
    body.append(
      createElement('dt', '', '준비물'),
      createElement('dd', '', activity.materials),
      createElement('dt', '', '진행 순서'),
      stepsValue,
      ...buildDetail('확인 방법', activity.check)
    );

    const card = createElement('article', 'card');
    card.append(head, body);
    return card;
  }

  function buildErrorCard(message, onRetry) {
    const card = createElement('article', 'card card--error');
    card.setAttribute('role', 'alert');
    card.append(createElement('p', '', message));

    if (onRetry) {
      const retry = createElement('button', 'button button--secondary', '다시 시도');
      retry.type = 'button';
      retry.addEventListener('click', onRetry);
      card.append(retry);
    }
    return card;
  }

  function buildSkeletonCards(count) {
    return Array.from({ length: count }, () => createElement('div', 'card card--skeleton'));
  }

  window.Cards = { buildQuizCard, buildActivityCard, buildErrorCard, buildSkeletonCards };
})();
