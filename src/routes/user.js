const Router = require("koa-router")
const router = new Router()
const User = require('../models/user')

// CREATE
router.post('/api/users', async (ctx) => {
  const document = ctx.request.body;
  const newDoc = new User(document);
  const savedDoc = await newDoc.save();

  ctx.status = 201;
  ctx.body = savedDoc;
});

// READ
router.get('/api/users/:id', async (ctx) => {
  const { id } = ctx.params;
  const doc = await User.findById(id);

  if (doc) {
    ctx.body = doc;
  } else {
    ctx.status = 404;
    ctx.body = { error: 'Document not found' };
  }
});

// UPDATE
router.put('/api/users/:id', async (ctx) => {
  const { id } = ctx.params;
  const updates = ctx.request.body;

  const updatedDoc = await User.findByIdAndUpdate(id, updates, { new: true });

  if (updatedDoc) {
    ctx.body = updatedDoc;
  } else {
    ctx.status = 404;
    ctx.body = { error: 'Document not found' };
  }
});

// DELETE
router.delete('/api/users/:id', async (ctx) => {
  const { id } = ctx.params;

  const deletedDoc = await User.findByIdAndDelete(id);

  if (deletedDoc) {
    ctx.body = { message: 'Document deleted' };
  } else {
    ctx.status = 404;
    ctx.body = { error: 'Document not found' };
  }
});

// LIST ALL DOCUMENTS IN A COLLECTION
router.get('/api/users', async (ctx) => {
  const docs = await User.find();

  ctx.body = docs;
});

module.exports = router