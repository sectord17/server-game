module.exports = exports = class Brodcaster {
    constructor() {
        this.init();
    }

    init() {
        /** @type {Map.<Function, Set>} */
        this.listeners = new Map();
    }

    /**
     * @param {Function} event
     */
    fire(event) {
        this.listeners
            .forEach((listeners, eventClass) => {
                if (event instanceof eventClass) {
                    listeners.forEach(listener => listener(event))
                }
            });
    }

    /**
     * @param {Function} event
     * @param {Function} listener
     */
    listen(event, listener) {
        const listeners = this._getOrCreateEventListeners(event);
        listeners.add(listener);
    }

    /**
     * @param {Function} event
     * @param {Function} listener
     */
    unlisten(event, listener) {
        const listeners = this._getOrCreateEventListeners(event);
        listeners.delete(listener);
    }

    /**
     * @param {Function} event
     * @returns {Set}
     * @private
     */
    _getOrCreateEventListeners(event) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }

        return this.listeners.get(event);
    }
};