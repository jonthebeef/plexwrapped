import { describe, it, expect } from 'vitest';
import { VERSION } from './index';

describe('index', () => {
	it('exports VERSION', () => {
		expect(VERSION).toBe('0.0.1');
	});
});
