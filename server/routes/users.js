const express = require("express");
const User = require("../models/User"); // MongoDB 모델
const router = express.Router();

router.get('/:providerId/items', async (req, res) => {
  const { providerId } = req.params;
  const { type, content } = req.body;

  try {
    const user = await User.findOne({ providerId });
    if (!user) return res.status(404).send('User not found');

    res.status(200).send(user.items);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.post('/:providerId/items', async (req, res) => {
  const { providerId } = req.params;
  const { type, content } = req.body;

  try {
    const user = await User.findOne({ providerId });
    if (!user) return res.status(404).send('User not found');

    user.items.push({ type, content });
    await user.save();
    res.status(201).send(user.items);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.put('/:providerId/items/:itemIndex', async (req, res) => {
  const { providerId, itemIndex } = req.params;
  const { type, content } = req.body;

  try {
    const user = await User.findOne({ providerId });
    if (!user) return res.status(404).send('User not found');

    if (user.items[itemIndex]) {
      user.items[itemIndex] = { type, content };
      await user.save();
      res.status(200).send(user.items);
    } else {
      res.status(404).send('Item not found');
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.delete('/:providerId/items/:itemIndex', async (req, res) => {
  const { providerId, itemIndex } = req.params;

  try {
    const user = await User.findOne({ providerId });
    if (!user) return res.status(404).send('User not found');

    if (user.items[itemIndex]) {
      user.items.splice(itemIndex, 1);
      await user.save();
      res.status(200).send(user.items);
    } else {
      res.status(404).send('Item not found');
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;