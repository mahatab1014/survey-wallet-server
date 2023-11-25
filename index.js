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
    const commentsCollection = database.collection("comments_collection");

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
    app.get("/api/v1/survey-parti-user", async (req, res) => {
      const { email, id } = req.query;
      const query = { _id: new ObjectId(id), "participate_user.user": email };
      // const query = { participate_user: email };
      try {
        const result = await surveyCollection.findOne(query);

        if (result) {
          const userVoteData = result.participate_user.find(
            (user) => user.user === email
          );

          res.status(200).send({ vote_data: userVoteData, participate: true });
        } else {
          res.status(200).json({ participate: false });
        }
      } catch (error) {
        console.error("Error checking participation:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    app.post("/api/v1/survey-likes-comments/:id", async (req, res) => {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid ObjectId format" });
      }

      const query = { _id: new ObjectId(id) };
      const data = req.body;

      try {
        let updateFields = {};

        if (data.user_liked || data.user_likes) {
          updateFields = {
            $push: { user_liked: data.user_liked },
            $set: { likes: data.likes },
          };
        } else {
          updateFields = {
            $push: { user_dis_liked: data.user_dis_liked },
            $set: { dis_likes: data.dis_likes },
          };
        }

        const result = await surveyCollection.updateOne(query, updateFields);

        if (result.modifiedCount === 1) {
          res.status(200).json({ message: "Survey updated successfully." });
        } else {
          res.status(404).json({ message: "Survey not found." });
        }
      } catch (error) {
        console.error("Error updating survey:", error);
        res.status(500).json({ message: "Internal server error" });
      }
      console.log(data);
    });

    app.get("/api/v1/survey-liked-user", async (req, res) => {
      const { email, id } = req.query;
      const query = {
        _id: new ObjectId(id),
        "user_liked.email": email,
      };
      try {
        const result = await surveyCollection.findOne(query);

        if (result) {
          const user_liked = result?.user_liked?.find(
            (user) => user.email === email
          );

          res.status(200).send({
            user_liked: user_liked,
            liked: true,
          });
        } else {
          res.status(200).json({ liked: false });
        }
      } catch (error) {
        console.error("Error checking participation:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });
    app.get("/api/v1/survey-dis-liked-user", async (req, res) => {
      const { email, id } = req.query;
      const query = {
        _id: new ObjectId(id),
        "user_dis_liked.email": email,
      };
      console.log(query);
      try {
        const result = await surveyCollection.findOne(query);

        if (result) {
          const user_dis_liked = result?.user_dis_liked?.find(
            (user) => user.email === email
          );

          res.status(200).send({
            user_dis_liked: user_dis_liked,
            dis_liked: true,
          });
        } else {
          res.status(200).json({ dis_liked: false });
        }
      } catch (error) {
        console.error("Error checking participation:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    app.post("/api/v1/survey-comments", async (req, res) => {
      const data = req.body;
      const result = await commentsCollection.insertOne(data);
      res.status(200).send(result);
    });
    app.get("/api/v1/survey-comments/:id", async (req, res) => {
      const { id } = req.params;

      const query = { survey_id: id };

      const results = await commentsCollection.find(query).toArray();
      res.status(200).send(results);
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
