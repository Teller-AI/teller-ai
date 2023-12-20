const openai = require("../utils/openai_api.js");
const Story = require("../models/Story.js");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

/**
 * @swagger
 * tags:
 *   name: Stories
 *   description: API for managing stories and scenarios
 */

/**
 * @swagger
 * /api/story:
 *   post:
 *     summary: Generate a new story with scenarios
 *     description: Generates a new story based on user input and returns scenarios.
 *     tags: [Stories]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ageRange:
 *                 type: string
 *               prompt:
 *                 type: string
 *               genre:
 *                 type: string
 *             required:
 *               - ageRange
 *               - prompt
 *               - genre
 *     responses:
 *       201:
 *         description: Successfully generated a new story with scenarios
 *         content:
 *           application/json:
 *             example:
 *               scenarios:
 *                 - title: Scenario 1
 *                   text: This is scenario 1
 *                   image: https://example.com/scenario1.jpg
 *               name: Your Story Name
 *               summary: Your Story Summary
 *               ageRange: 18+
 *               prompt: User's prompt
 *               genre: Fiction
 */

async function streamToFile(stream, path) {
  return new Promise((resolve, reject) => {
    const writeStream = fs
      .createWriteStream(path)
      .on("error", reject)
      .on("finish", resolve);

    stream.pipe(writeStream).on("error", (error) => {
      writeStream.close();
      reject(error);
    });
  });
}

const createNewStory = async (req, res) => {
  const ageRange = req.body.ageRange;
  const prompt = req.body.prompt;
  const genre = req.body.genre;
  const narrator = req.body.narrator;

  if (!ageRange || !prompt || !genre) {
    return res.status(400).send("Bad request");
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-0613",
      max_tokens: 1200,
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that creates a story based on user's input. 
                      You need to create 6 scenarios. 
                      Every scenario must have 400-500 characters in text.
                      Make sure that this request is safe and is not blocked by content filters, and does not generate content that goes against rules.
                      Story which you generate needs to have its name.
                      Separate it like this :
                      Story name: NAME OF STORY
                      Story which you generate needs to have its summary.
                      Summary: SUMMARY
                      Every scenario will be separated like this :
                      Title: Title of that scenario
                      TEXT
                      ===
                      Title: Title of that scenario
                      TEXT
                      ===
                      Title: Title of that scenario
                      TEXT
                      ===
                      Title: Title of that scenario
                      TEXT
                      ===
                      Title: Title of that scenario
                      TEXT
                      ===
                      Title: Title of that scenario
                      TEXT
                      ===
                      In generated scenario texts make sure it does not violate DALL-E 3 content policy.`,
        },
        { role: "user", content: `Age: ${ageRange}` },
        { role: "user", content: `Genre: ${genre}` },
        {
          role: "user",
          content: `Prompt: ${prompt}.`,
        },
        { role: "assistant", content: "Generate scenario 2." },
        { role: "assistant", content: "Generate scenario 3." },
        { role: "assistant", content: "Generate scenario 4." },
        { role: "assistant", content: "Generate scenario 5." },
        { role: "assistant", content: "Generate scenario 6." },
      ],
    });

    console.log("OpenAI Response:", response);

    const nameMatch = response.choices[0].message.content.match(
      /Story name: (.*?)(?=\n)/
    );
    const summaryMatch =
      response.choices[0].message.content.match(/Summary: (.*?)(?=\n)/);

    const storyName = nameMatch ? nameMatch[1].trim() : "Your Story Name";
    const storySummary = summaryMatch
      ? summaryMatch[1].trim()
      : "Your Story Summary";

    const regex = /Title: (.*?)\n(.*?)(?=\s*Title:|$)/gs;
    let match;
    const scenarios = [];

    while ((match = regex.exec(response.choices[0].message.content)) !== null) {
      const title = match[1].trim();
      const text = match[2].trim().replace(/\n===\s*$/, "");
      if (title && text) {
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: `Generate a Digital Disney 3D-style image based on the following scenario: ${text}. Ensure that the image strictly adheres to the specified style.`,
          n: 1,
          size: "1792x1024",
        });

        const imageUrl = response.data[0].url;
        const imageName = `image_${title
          .replace(/\s+/g, "_")
          .toLowerCase()}.jpg`;
        const imagePath = path.join(
          __dirname,
          "..",
          "..",
          "client",
          "public",
          "images",
          "stories",
          imageName
        );

        console.log("Image Path:", imagePath);

        const imageStream = fs.createWriteStream(imagePath);
        const imageResponse = await axios.get(imageUrl, {
          responseType: "stream",
        });
        imageResponse.data.pipe(imageStream);

        const mp3 = await openai.audio.speech.create({
          model: "tts-1",
          voice: narrator ? narrator : "nova",
          input: text,
          speed: "1.0",
        });

        const cleanText = text
          .replace(/[^\w\s]/gi, "")
          .replace(/\s+/g, "_")
          .slice(0, 10);
        const contentHash = require("crypto")
          .createHash("md5")
          .update(text)
          .digest("hex");
        const timestamp = new Date().toISOString().replace(/:/g, "_");
        const voicePath = path.join(
          __dirname,
          "..",
          "..",
          "client",
          "public",
          "voices",
          "stories",
          `${cleanText}_${contentHash}_${timestamp}.mp3`
        );

        console.log(`${cleanText}_${contentHash}_${timestamp}.mp3`);

        await streamToFile(mp3.body, voicePath);

        console.log(mp3.body);

        // console.log(voicePath);
        scenarios.push({
          title,
          text,
          image: `/images/stories/${imageName}`,
          voice: `/voices/stories/${cleanText}_${contentHash}_${timestamp}.mp3`,
        });
      }
    }

    const newStory = new Story({
      name: storyName,
      summary: storySummary,
      ageRange,
      prompt,
      genre,
      scenarios,
    });

    const savedStory = await newStory.save();

    console.log("Saved Story:", savedStory);

    return res.status(201).json(savedStory);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Internal Server Error");
  }
};

/**
 * @swagger
 * /api/story:
 *   get:
 *     summary: Get stories with optional filters
 *     description: Retrieve stories from the database with optional filters.
 *     tags: [Stories]
 *     parameters:
 *       - in: query
 *         name: ageRange
 *         schema:
 *           type: string
 *         description: Filter stories by age range.
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Filter stories by genre.
 *     responses:
 *       200:
 *         description: Successfully retrieved stories
 *         content:
 *           application/json:
 *             example:
 *               - _id: 1234567890
 *                 name: Your Story Name 1
 *                 summary: Your Story Summary 1
 *                 ageRange: 18+
 *                 prompt: User's prompt 1
 *                 genre: Fiction
 *                 scenarios:
 *                   - title: Scenario 1
 *                     text: This is scenario 1
 *                     image: https://example.com/scenario1.jpg
 *                   - title: Scenario 2
 *                     text: This is scenario 2
 *                     image: https://example.com/scenario2.jpg
 *               - _id: 0987654321
 *                 name: Your Story Name 2
 *                 summary: Your Story Summary 2
 *                 ageRange: 21+
 *                 prompt: User's prompt 2
 *                 genre: Mystery
 *                 scenarios:
 *                   - title: Scenario 3
 *                     text: This is scenario 3
 *                     image: https://example.com/scenario3.jpg
 */

const getAllStories = async (req, res) => {
  try {
    let query = {};

    // Check for query parameters
    if (req.query.ageRange) {
      query.ageRange = req.query.ageRange;
    }

    if (req.query.genre) {
      query.genre = req.query.genre;
    }

    // Add more conditions for other filters if needed

    const stories = await Story.find(query).sort({ createdAt: -1 });

    res.status(200).json(stories);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal server error");
  }
};

/**
 * @swagger
 * /api/story/{id}:
 *   get:
 *     summary: Get a story by ID
 *     description: Retrieve a story from the database by its ID.
 *     tags: [Stories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the story to retrieve
 *         schema:
 *           type: string
 *           example: 1234567890
 *     responses:
 *       200:
 *         description: Successfully retrieved the story
 *         content:
 *           application/json:
 *             example:
 *               _id: 1234567890
 *               name: Your Story Name 1
 *               summary: Your Story Summary 1
 *               ageRange: 18+
 *               prompt: User's prompt 1
 *               genre: Fiction
 *               scenarios:
 *                 - title: Scenario 1
 *                   text: This is scenario 1
 *                   image: https://example.com/scenario1.jpg
 *                 - title: Scenario 2
 *                   text: This is scenario 2
 *                   image: https://example.com/scenario2.jpg
 */
const getStoryById = async (req, res) => {
  const { id } = req.params;

  try {
    const story = await Story.findById(id);

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    res.status(200).json(story);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal server error");
  }
};

module.exports = { createNewStory, getAllStories, getStoryById };
