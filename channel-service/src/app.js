const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const sendRoutes = require("./routes/send.routes");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("combined"));

app.use("/", sendRoutes);

module.exports = { app };
