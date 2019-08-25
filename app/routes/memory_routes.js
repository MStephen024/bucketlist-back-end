const express = require('express')

// pull in Mongoose model for memories
const Memory = require('../models/memory')

// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')

// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership

// this is middleware that will remove blank fields from `req.body`, e.g.
// { memory: { title: '', text: 'foo' } } -> { memory: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')

// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', {
  session: false
})

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// INDEX
router.get('/memories', requireToken, (req, res, next) => {
  Memory.find({ owner: req.user.id })
    .then(memories => {
      return memories.map(memory => memory.toObject())
    })
    .then(memories => {
      res.json({ memories })
    })
    .catch(next)
})

// SHOW
router.get('/memories/:id', requireToken, (req, res, next) => {
  // req.params.id will be set based on the `:id` in the route
  Memory.findById(req.params.id)
    .then(handle404)
    .then(memories => res.json({ memories: memories.toObject() }))
    .catch(next)
})

// CREATE
router.post('/memories', requireToken, (req, res, next) => {
  req.body.memory.owner = req.user.id

  Memory.create(req.body.memory)
    .then(memory => {
      res.status(201).json({ memory: memory.toObject() })
    })
    .catch(next)
})

// UPDATE
router.patch('/memories/:id', requireToken, removeBlanks, (req, res, next) => {
  delete req.body.memory.owner
  Memory.findById(req.params.id)
    .then(handle404)
    .then(memory => {
      requireOwnership(req, memory)
      return memory.update(req.body.memory)
    })
    .then(() => res.sendStatus(204))
    .catch(next)
})

// DESTROY
router.delete('/memories/:id', requireToken, (req, res, next) => {
  Memory.findById(req.params.id)
    .then(handle404)
    .then(memory => {
      requireOwnership(req, memory)
      memory.remove()
    })
    .then(() => res.sendStatus(204))
    .catch(next)
})

module.exports = router
