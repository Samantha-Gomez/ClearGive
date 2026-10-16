const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getPagination,
  getPaginationMeta,
} = require('../utils/pagination');

test('uses safe defaults for pagination', () => {
  assert.deepEqual(getPagination({}), {
    page: 1,
    limit: 20,
    skip: 0,
  });
});

test('calculates page offsets and caps large limits', () => {
  assert.deepEqual(getPagination({ page: '3', limit: '500' }), {
    page: 3,
    limit: 100,
    skip: 200,
  });
});

test('returns useful pagination metadata', () => {
  assert.deepEqual(getPaginationMeta({ page: 2, limit: 20, total: 45 }), {
    page: 2,
    limit: 20,
    total: 45,
    totalPages: 3,
    hasNextPage: true,
    hasPreviousPage: true,
  });
});
