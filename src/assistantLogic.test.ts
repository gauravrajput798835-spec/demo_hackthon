import assert from 'node:assert/strict';
import { test } from 'node:test';
import { answerQuestion, HOLIDAY_FALLBACK } from './assistantLogic.ts';

test('holiday duration questions never use an exam answer', () => {
  const result = answerQuestion('Kitne din college off hai?');
  assert.equal(result.intent, 'holiday');
  assert.equal(result.kind, 'unknown');
  assert.equal(result.text, HOLIDAY_FALLBACK);
  assert.equal(result.faq, undefined);
});

test('tomorrow closure questions use the holiday fallback', () => {
  const result = answerQuestion('Kal college band hai kya?');
  assert.equal(result.intent, 'holiday');
  assert.equal(result.text, HOLIDAY_FALLBACK);
});

test('exam deadline questions return only the historical deadline source', () => {
  const result = answerQuestion('Exam form ki last date kya hai?');
  assert.equal(result.intent, 'deadline');
  assert.equal(result.kind, 'verified');
  assert.match(result.text, /historical/i);
  assert.doesNotMatch(result.text, /current deadline is November|latest verified.*2024/i);
});

test('exam document questions return the document FAQ', () => {
  const result = answerQuestion('BCA exam ke liye kaun se documents chahiye?');
  assert.equal(result.intent, 'documents');
  assert.equal(result.kind, 'verified');
  assert.match(result.text, /दस्तावेज़/);
  assert.ok(result.faq?.documents.length);
});
