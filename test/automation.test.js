import { test } from 'node:test';
import assert from 'node:assert/strict';

import automation from '../src/automation.cjs';

const {
  truncateSummary,
  buildDescription,
  buildIssuePayload,
  parseIssueResult,
  isSelfSent,
  parseProcessedIds,
  pruneProcessedIds,
  buildNotificationBody,
  buildRawEmail
} = automation;

const fixedNow = { toLocaleString: () => '1/1/2024, 12:00:00 PM' };

test('truncateSummary keeps a short subject unchanged', () => {
  assert.equal(truncateSummary('Printer is broken'), 'Printer is broken');
});

test('truncateSummary returns a default for empty or whitespace subjects', () => {
  assert.equal(truncateSummary(''), 'No Subject');
  assert.equal(truncateSummary('   \n\t '), 'No Subject');
  assert.equal(truncateSummary(undefined), 'No Subject');
});

test('truncateSummary collapses internal whitespace and newlines', () => {
  assert.equal(truncateSummary('line one\nline   two'), 'line one line two');
});

test('truncateSummary caps at the Jira summary limit with an ellipsis', () => {
  const result = truncateSummary('x'.repeat(400));
  assert.equal(result.length, 255);
  assert.ok(result.endsWith('...'));
});

test('truncateSummary honours a custom max length', () => {
  assert.equal(truncateSummary('abcdefghij', 5), 'ab...');
});

test('buildDescription includes sender, date and body', () => {
  const result = buildDescription('user@example.com', 'Help please', fixedNow);
  assert.match(result, /From: user@example\.com/);
  assert.match(result, /Date: 1\/1\/2024/);
  assert.match(result, /Help please$/);
});

test('buildDescription falls back to a default for empty body', () => {
  assert.match(buildDescription('user@example.com', '   ', fixedNow), /No content$/);
});

test('buildDescription caps overly long descriptions', () => {
  const result = buildDescription('user@example.com', 'y'.repeat(40000), fixedNow);
  assert.equal(result.length, 32767);
  assert.ok(result.endsWith('...'));
});

test('buildIssuePayload produces a valid Jira issue body', () => {
  const payload = buildIssuePayload('Need access', 'Body text', 'user@example.com', 'OPS', fixedNow);
  assert.deepEqual(payload.fields.project, { key: 'OPS' });
  assert.equal(payload.fields.summary, 'Need access');
  assert.deepEqual(payload.fields.issuetype, { name: 'Task' });
  assert.match(payload.fields.description, /Body text$/);
});

test('buildIssuePayload truncates a long subject into the summary', () => {
  const payload = buildIssuePayload('z'.repeat(400), 'b', 's', 'OPS', fixedNow);
  assert.equal(payload.fields.summary.length, 255);
});

test('parseIssueResult returns the key and browse url', () => {
  const result = parseIssueResult('{"key":"OPS-12"}', 'https://acme.atlassian.net');
  assert.deepEqual(result, { key: 'OPS-12', url: 'https://acme.atlassian.net/browse/OPS-12' });
});

test('parseIssueResult throws when the key is missing', () => {
  assert.throws(() => parseIssueResult('{"id":"100"}', 'https://acme.atlassian.net'));
});

test('parseIssueResult throws on malformed JSON', () => {
  assert.throws(() => parseIssueResult('not json', 'https://acme.atlassian.net'));
});

test('isSelfSent matches the monitored address case-insensitively', () => {
  assert.equal(isSelfSent('Support <SUPPORT@acme.com>', 'support@acme.com'), true);
  assert.equal(isSelfSent('User <user@acme.com>', 'support@acme.com'), false);
});

test('isSelfSent is false for empty inputs', () => {
  assert.equal(isSelfSent('', 'support@acme.com'), false);
  assert.equal(isSelfSent('User <user@acme.com>', ''), false);
});

test('pruneProcessedIds drops entries older than the ttl and keeps recent ones', () => {
  const now = 1_000_000_000_000;
  const day = 24 * 60 * 60 * 1000;
  const input = { old: now - 31 * day, recent: now - 1 * day };
  const result = pruneProcessedIds(input, now);
  assert.deepEqual(result, { recent: now - 1 * day });
});

test('pruneProcessedIds does not mutate its input and handles empty maps', () => {
  const input = { a: 1 };
  pruneProcessedIds(input, 1_000_000_000_000);
  assert.deepEqual(input, { a: 1 });
  assert.deepEqual(pruneProcessedIds(null, 1_000_000_000_000), {});
  assert.deepEqual(pruneProcessedIds({}, 1_000_000_000_000), {});
});

test('pruneProcessedIds honours a custom max age', () => {
  const now = 1_000_000;
  const result = pruneProcessedIds({ keep: now - 100, drop: now - 1000 }, now, 500);
  assert.deepEqual(result, { keep: now - 100 });
});

test('parseProcessedIds returns the parsed map for valid JSON', () => {
  assert.deepEqual(parseProcessedIds('{"abc":123}'), { abc: 123 });
});

test('parseProcessedIds falls back to an empty map on malformed JSON', () => {
  assert.deepEqual(parseProcessedIds('not-json'), {});
  assert.deepEqual(parseProcessedIds('{"abc":'), {});
});

test('parseProcessedIds falls back to an empty map for missing or empty input', () => {
  assert.deepEqual(parseProcessedIds(null), {});
  assert.deepEqual(parseProcessedIds(undefined), {});
  assert.deepEqual(parseProcessedIds(''), {});
});

test('parseProcessedIds rejects non-object JSON values', () => {
  assert.deepEqual(parseProcessedIds('5'), {});
  assert.deepEqual(parseProcessedIds('"abc"'), {});
  assert.deepEqual(parseProcessedIds('null'), {});
  assert.deepEqual(parseProcessedIds('[1,2,3]'), {});
});

test('buildNotificationBody includes the task key, subject, sender and url', () => {
  const body = buildNotificationBody('Broken printer', 'user@example.com', { key: 'OPS-9', url: 'https://acme.atlassian.net/browse/OPS-9' }, fixedNow);
  assert.match(body, /Task: OPS-9/);
  assert.match(body, /Subject: Broken printer/);
  assert.match(body, /From: user@example\.com/);
  assert.match(body, /View task: https:\/\/acme\.atlassian\.net\/browse\/OPS-9/);
});

test('buildRawEmail builds CRLF-delimited headers with a blank line before the body', () => {
  const raw = buildRawEmail('from@acme.com', 'to@acme.com', 'Hi', 'Body line');
  assert.equal(raw, 'From: from@acme.com\r\nTo: to@acme.com\r\nSubject: Hi\r\n\r\nBody line');
});
