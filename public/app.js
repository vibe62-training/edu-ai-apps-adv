const FEATURES = {
  quiz: {
    endpoint: '/api/generate',
    busyButton: '생성 중…',
    busyStatus: '문항을 만들고 있습니다…',
    failText: '문항을 만들지 못했습니다. 다시 시도해 주세요.',
    doneText: (count) => `문항 ${count}개를 만들었습니다.`,
    buildCard: Cards.buildQuizCard,
    toRequest: (fields) => ({
      type: 'quiz',
      input: {
        grade: fields.grade,
        subject: fields.subject,
        topic: fields.topic,
        questionType: fields.type,
        count: fields.count,
        difficulty: fields.level,
        reference: fields.reference,
      },
    }),
  },
  activity: {
    endpoint: '/api/activities',
    busyButton: '추천 중…',
    busyStatus: '활동을 추천하고 있습니다…',
    failText: '활동을 추천하지 못했습니다. 다시 시도해 주세요.',
    doneText: (count) => `활동 ${count}개를 추천했습니다.`,
    buildCard: Cards.buildActivityCard,
  },
};

function getControl(field) {
  return field.querySelector('select, textarea, input:not([type="radio"])');
}

function toCheckItem(field) {
  const control = getControl(field);
  const unit = field.querySelector('.unit');
  return {
    name: control.name,
    label: field.dataset.label,
    value: control.value,
    required: control.required,
    min: control.dataset.min,
    max: control.dataset.max,
    unit: unit ? unit.textContent.trim() : '',
    badInput: control.validity.badInput,
  };
}

function setDescribedBy(control, id, connected) {
  const ids = (control.getAttribute('aria-describedby') || '')
    .split(' ')
    .filter((item) => item && item !== id);
  if (connected) ids.push(id);

  if (ids.length > 0) {
    control.setAttribute('aria-describedby', ids.join(' '));
  } else {
    control.removeAttribute('aria-describedby');
  }
}

function showFieldError(control, message) {
  const errorId = `${control.id}-error`;
  let error = document.getElementById(errorId);

  if (!message) {
    if (error) error.remove();
    control.removeAttribute('aria-invalid');
    setDescribedBy(control, errorId, false);
    return;
  }

  if (!error) {
    error = document.createElement('p');
    error.className = 'field-error';
    error.id = errorId;
    (control.closest('.input-with-unit') || control).after(error);
  }
  error.textContent = message;
  control.setAttribute('aria-invalid', 'true');
  setDescribedBy(control, errorId, true);
}

function checkForm(form) {
  const fields = [...form.querySelectorAll('[data-field]')].filter(getControl);
  const errors = FormCheck.checkFields(fields.map(toCheckItem));
  let firstInvalid = null;

  for (const field of fields) {
    const control = getControl(field);
    const error = errors.find((item) => item.name === control.name);
    showFieldError(control, error ? error.message : '');
    if (error && !firstInvalid) firstInvalid = control;
  }

  if (firstInvalid) firstInvalid.focus();
  return errors.length === 0;
}

function setUpSubmitForm(form) {
  const feature = FEATURES[form.dataset.feature];
  const list = document.querySelector('[data-result-list]');
  const status = document.querySelector('[data-result-status]');
  const button = form.querySelector('button[type="submit"]');
  const idleButton = button.textContent;

  function setBusy(busy) {
    button.disabled = busy;
    button.textContent = busy ? feature.busyButton : idleButton;
    for (const control of form.querySelectorAll('input, select, textarea')) {
      control.disabled = busy;
    }
    for (const link of document.querySelectorAll('.sidebar a')) {
      link.setAttribute('aria-disabled', String(busy));
      link.tabIndex = busy ? -1 : 0;
    }
  }

  function showFailure() {
    status.textContent = '';
    list.replaceChildren(Cards.buildErrorCard(feature.failText, () => form.requestSubmit()));
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!checkForm(form)) return;

    // Read the form before setBusy disables its inputs; disabled fields are left out of FormData.
    const fields = Object.fromEntries(new FormData(form));
    const payload = JSON.stringify(feature.toRequest ? feature.toRequest(fields) : fields);
    setBusy(true);
    status.textContent = feature.busyStatus;
    list.replaceChildren(...Cards.buildSkeletonCards(3));

    try {
      const response = await fetch(feature.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });
      if (!response.ok) throw new Error(`서버 응답 ${response.status}`);

      const { items } = await response.json();
      list.replaceChildren(...items.map((item, index) => feature.buildCard({ ...item, number: index + 1 })));
      status.textContent = feature.doneText(items.length);
    } catch (error) {
      showFailure();
    } finally {
      setBusy(false);
    }
  });
}

function setUpCharCount(counter) {
  const control = document.getElementById(counter.dataset.countFor);
  const update = () => {
    counter.textContent = `${control.value.length}/${counter.dataset.max}`;
  };
  control.addEventListener('input', update);
  update();
}

document.querySelectorAll('[data-submit-form]').forEach(setUpSubmitForm);
document.querySelectorAll('[data-count-for]').forEach(setUpCharCount);
