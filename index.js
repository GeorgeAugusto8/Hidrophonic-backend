var http = require('http');
const express = require("express");
const cors = require("cors");
const socket = require("socket.io");
const mongodb = require("mongodb");

const {MongoClient} = mongodb;

const app = express();
app.use(cors());
const server = http.createServer(app);

const uri = "mongodb+srv://hidroponic:c4vh6C5ZYcZc7vng@cluster0.ewvnc7m.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);

const io = socket(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", async(socket) => {
  console.log(`User Connected: ${socket.id}`);

  const initialData = await loadInitialData();
  io.emit('initialData', initialData);

});

const database = client.db("hidroponic");
const measurementsCollection = database.collection("Measurements");

const loadInitialData = async () => {
  const temperature = await initialDataQuery(1);
  const ph = await initialDataQuery(2);
  const humidity = await initialDataQuery(3);
  const oxygen = await initialDataQuery(4);

  return {
    temperature,
    ph,
    humidity,
    oxygen
  };
};

const initialDataQuery = async (number) => {
  return await measurementsCollection
  .find({type: number})
  .sort({measuredDate: 1})
  .limit(50)
  .toArray();
};

try {
  var changeStream = measurementsCollection.watch();

  changeStream.on("change", data => {
    var newData = data.fullDocument;
    io.emit('newData', newData);
  });
} catch (e) {
  console.log(e);
};


server.listen(3001, () => {
  console.log("SERVER IS RUNNING");
});



