const express = require('express');
const ExpressError = require('../expressError');
const router = new express.Router();
const { ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth');
const Message = require('../models/message');
const { messagesFrom } = require('../models/user');


/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get('/:id', ensureLoggedIn, async (req, res, next) => {
    try {
        const { id } = req.params;
        const msg = await Message.get(id);
        if (msg.from_user.username != req.user || msg.to_user.username != req.user) throw new ExpressError("Cannot access other people's messages", 401)
        return res.json({ msg })
    } catch (e) {
        return next(e)
    }
});


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post('/', ensureLoggedIn, async (req, res, next) => {
    const { to_username, body } = req.body;
    const from_user = req.user.username;
    const msg = await Message.create(from_user, to_username, body);
    return res.json(msg)
})

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post('/:id/read', ensureLoggedIn, (req, res, next) => {
    try {
        const { id } = req.params;
        const msg = Message.get(id);
        if (msg.to_user.username != req.user.username) throw new ExpressError("You can't read other's messages", 401);
        const message = Message.markRead(id);
        return res.json(message);
    } catch (e) {
        return next(e)
    }
})
module.exports = router;