module.exports = class ModelNotFoundError {
    constructor(model, id) {
        this.model = model;
        this.id = id;
    }
};