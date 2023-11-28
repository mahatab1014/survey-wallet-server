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
    const usersCollection = database.collection("users_collection");
    const commentsCollection = database.collection("comments_collection");
    const reportCollection = database.collection("report_collection");

    // survey collection
    app.post("/api/v1/surveys", async (req, res) => {
      const data = req.body;
      const result = await surveyCollection.insertOne(data);
      res.status(200).send(result);
    });
    app.put("/api/v1/survey-update/:id", async (req, res) => {
      const { id } = req.params;
      console.log("Survey ID:", id);
      const data = req.body;
      try {
        const updatedSurvey = await surveyCollection.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: data },
          { returnDocument: "after" }
        );
        if (!updatedSurvey.value) {
          return res.status(404).json({ message: "Survey not found" });
        }
        console.log("Updated survey:", updatedSurvey.value);
        res.status(200).json(updatedSurvey.value);
      } catch (error) {
        console.error("Error updating survey:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });
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
    // ::: find survey by email address :::::
    app.get("/api/v1/find-survey-by-email/:email", async (req, res) => {
      const { email } = req.params;
      const query = { "user.email": email };
      const data = await surveyCollection.find(query).toArray();
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
    app.delete("/api/v1/survey/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await surveyCollection.deleteOne(query);
      if (result.deletedCount === 1) {
        res.status(200).json({ message: "Survey deleted successfully." });
      } else {
        res.status(404).json({ message: "Survey not found." });
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
    app.post("/api/v1/survey-featured/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const data = req.body;
      try {
        let updateFeatured = {};

        if (data?.featured === "true") {
          updateFeatured = {
            $set: { featured: "true" },
          };
        } else {
          updateFeatured = {
            $set: { featured: "false" },
          };
        }

        const result = await surveyCollection.updateOne(query, updateFeatured);

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
    app.put("/api/v1/survey-status/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const data = req.body;
      try {
        let updateFeatured = { $set: data };

        const result = await surveyCollection.updateOne(query, updateFeatured);

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

    // :::::::: Survey Report API ::::::::::
    app.post("/api/v1/report-survey", async (req, res) => {
      const data = req.body;
      const result = await reportCollection.insertOne(data);
      res.send(result);
    });
    app.get("/api/v1/report-survey", async (req, res) => {
      const result = await reportCollection.find().toArray();
      res.send(result);
    });
    app.get("/api/v1/single-report-survey", async (req, res) => {
      const { email, id } = req.query;
      console.log("report", id);
      console.log("report", email);
      const query = {
        survey_id: id,
        "user_reported.email": email,
      };
      const result = await reportCollection.findOne(query);
      res.send(result);
    });
    app.delete("/api/v1/survey-report/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await reportCollection.deleteOne(query);
      if (result.deletedCount === 1) {
        res.status(200).json({ message: "Survey deleted successfully." });
      } else {
        res.status(404).json({ message: "Survey not found." });
      }
    });

    // ::::::: USER API :::::::::
    app.put("/api/v1/users/:email", async (req, res) => {
      const { email } = req.params;
      const data = req.body;

      const existingUser = await usersCollection.findOne({ email });
      try {
        if (existingUser) {
          // If user exists, update the IP address
          await usersCollection.updateOne(
            { email },
            { $set: { last_login_ip: data.last_login_ip } }
          );
          res.json({ message: "User updated successfully" });
        } else {
          // If user does not exist, insert the new user data
          await usersCollection.insertOne({
            name: data.name,
            email: data.email,
            email_verified: data.email_verified,
            role: data.role,
            profile_pic: data.profile_pic,
            last_login_ip: data.last_login_ip,
          });
          res.json({ message: "User inserted successfully" });
        }
      } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });
    app.put("/api/v1/user-role/:id", async (req, res) => {
      const { id } = req.params;
      const data = req.body;
      const query = { _id: new ObjectId(id) };

      try {
        const user = await usersCollection.findOneAndUpdate(query, {
          $set: { role: data.role },
        });
        res.json({ message: "User role updated successfully" });
      } catch (error) {
        console.error("Error updating user role:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });
    app.get("/api/v1/users/:role?", async (req, res) => {
      const { role } = req.params;
      const query = role ? { role: role } : {};

      try {
        const result = await usersCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
      }
    });
    app.get("/api/v1/user/:email", async (req, res) => {
      const { email } = req.params;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      res.send(user);
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
