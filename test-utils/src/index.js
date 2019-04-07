import { options } from 'preact';

options.effects = [];

/**
 * Setup a rerender function that will drain the queue of pending renders
 * @returns {() => void}
 */
export function setupRerender() {
	options.__test__previousDebounce = options.debounceRendering;
	options.debounceRendering = cb => options.__test__drainQueue = cb;
	return () => options.__test__drainQueue && options.__test__drainQueue();
}

export function act(cb) {
	const previousRequestAnimationFrame = options.requestAnimationFrame;
	const rerender = setupRerender();
	let flush;
	// Override requestAnimationFrame so we can flush pending hooks.
	options.requestAnimationFrame = (fc) => flush = fc;
	// Execute the callback we were passed.
	cb();
	if (flush) {
		// State COULD be built up flush it.
		console.log(options.effects);
		while(options.effects.length > 0) {
			options.effects = [];
			flush();
			rerender();
		}
	}
	options.requestAnimationFrame = previousRequestAnimationFrame;
}

/**
 * Teardown test environment and reset preact's internal state
 */
export function teardown() {
	if (options.__test__drainQueue) {
		// Flush any pending updates leftover by test
		options.__test__drainQueue();
		delete options.__test__drainQueue;
	}

	if (typeof options.__test__previousDebounce !== 'undefined') {
		options.debounceRendering = options.__test__previousDebounce;
		delete options.__test__previousDebounce;
	}
}
