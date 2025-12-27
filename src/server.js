const mongoose = require('mongoose');
const app = require('./app');
const startWorker = require('./workers/index');

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log("Server running on port", PORT));
    startWorker();
  })
  .catch(err => {
    console.error("MongoDB Error:", err);
    process.exit(1);
  });
