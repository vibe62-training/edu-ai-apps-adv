(function () {
  function endsWithConsonant(word) {
    const code = word.charCodeAt(word.length - 1);
    if (code < 0xac00 || code > 0xd7a3) return null;
    return (code - 0xac00) % 28 !== 0;
  }

  function withParticle(word, afterConsonant, afterVowel) {
    const consonant = endsWithConsonant(word);
    if (consonant === null) return `${word}${afterConsonant}(${afterVowel})`;
    return word + (consonant ? afterConsonant : afterVowel);
  }

  function isSet(limit) {
    return limit !== undefined && limit !== '';
  }

  function isNumberInRange(value, min, max) {
    if (!/^-?\d+$/.test(value)) return false;
    const number = Number(value);
    if (isSet(min) && number < Number(min)) return false;
    if (isSet(max) && number > Number(max)) return false;
    return true;
  }

  function describeRange(min, max, unit) {
    if (isSet(min) && isSet(max)) return `${min}~${max}${unit} 사이의 `;
    if (isSet(min)) return `${min}${unit} 이상의 `;
    if (isSet(max)) return `${max}${unit} 이하의 `;
    return '';
  }

  // field: { name, label, value, required, min, max, unit, badInput, maxLength }
  function checkField(field) {
    const value = String(field.value ?? '').trim();
    const hasRange = isSet(field.min) || isSet(field.max);

    if (field.badInput || (hasRange && value !== '' && !isNumberInRange(value, field.min, field.max))) {
      const range = describeRange(field.min, field.max, field.unit || '');
      return `${withParticle(field.label, '은', '는')} ${range}정수로 입력하세요`;
    }

    if (field.required && value === '') {
      return `${withParticle(field.label, '을', '를')} 입력하세요`;
    }

    if (isSet(field.maxLength) && String(field.value ?? '').length > Number(field.maxLength)) {
      return `${withParticle(field.label, '은', '는')} ${field.maxLength}자 이내로 입력하세요`;
    }

    return '';
  }

  function checkFields(fields) {
    return fields
      .map((field) => ({ name: field.name, message: checkField(field) }))
      .filter((result) => result.message !== '');
  }

  globalThis.FormCheck = { checkFields };
})();
