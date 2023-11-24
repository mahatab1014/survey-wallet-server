const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mquj3zk.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const database = client.db("SurveyWalletDB");
    const surveyCollection = database.collection("survey_collection");

    // survey collection
    app.get("/api/v1/surveys", async (req, res) => {
      const results = await surveyCollection.find().toArray();
      res.status(200).send(results);
    });
    app.get("/api/v1/survey/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const data = await surveyCollection.findOne(query);
      res.status(200).send(data);
    });
    app.post("/api/v1/survey/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const newData = req.body;

      try {
        // Update the document in the survey_collection
        const result = await surveyCollection.updateOne(query, {
          $push: { participate_user: newData.participate_user },
          $set: { options: newData.options },
        });

        if (result.modifiedCount === 1) {
          res.status(200).json({ message: "Survey updated successfully." });
        } else {
          res.status(404).json({ message: "Survey not found." });
        }
      } catch (error) {
        console.error("Error updating survey:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
