const mongoose = require("mongoose")

// Middleware to dynamically create or retrieve a Mongoose model
function getModel(collectionName, schemaDefinition) {
  // Check if the model already exists
  if (mongoose.models[collectionName]) {
    return mongoose.model(collectionName);
  }

  // Create a new model if it doesn't exist
  const schema = new mongoose.Schema(schemaDefinition, { strict: false });

  // Example: Making certain fields immutable
  schema.pre('save', async function (next) {
    if (!this.isNew) {
      const immutableFields = ['username', 'email', 'uid'];
      for (const field of immutableFields) {
        if (this.isModified(field)) {
          return next(new Error(`Cannot modify the ${field} field`));
        }
      }
    }
    next();
  });

  return mongoose.model(collectionName, schema);
}
module.exports = { getModel }