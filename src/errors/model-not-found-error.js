class ModelNotFoundError extends Error {
    constructor(model, id) {
        super();

        this.model = model;
        this.id = id;
    }
}

module.exports = exports = ModelNotFoundError;
