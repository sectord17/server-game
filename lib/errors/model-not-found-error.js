module.exports = class ModelNotFoundError {
    constructor(model) {
        this.model = model;
    }
};