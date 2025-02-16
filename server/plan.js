import { MongoClient, ObjectId } from 'mongodb';
import { configDotenv } from 'dotenv';
configDotenv({ path: './.env' });

const url = process.env.DB_URL

const client = new MongoClient(url);

let db;
let collection;

async function connect() {
  await client.connect();
  console.log('')
  console.log("==> Connected to MongoDB");
  db = client.db("Plan");
  collection = db.collection("Plans");
}

async function close() {
  await client.close();
  console.log("Closed connection to MongoDB ==>");
  console.log('')
}

export async function readAllDocuments(uid, sortField = "CreateAt", sortOrder = -1) {
  try {
    await connect();
    const sortQuery = { [sortField]: sortOrder };
    const documents = await collection.find({ uid }).sort(sortQuery).toArray();
    console.log(" >> readAllDocuments <<");
    close()
    return documents;
  } catch (error) {
    console.error("Error readAllDocuments documents:", error);
    throw error;
  }
}

export async function findOneNearestToDate(uid) {
  try {
    await connect();
    const currentDate = new Date();

    const document = await collection
      .aggregate([
        { $match: { uid } },
        { $addFields: { start_date: { $toDate: "$StartDate" } } },
        { $addFields: { date_diff: { $abs: { $subtract: ["$start_date", currentDate] } } } },
        { $sort: { date_diff: 1 } },
        { $limit: 1 }
      ])
      .next();
    console.log(" >> findOneNearestToDate <<");
    close()
    return document;
  } catch (error) {
    console.error("Error findOneNearestToDate documents:", error);
    throw error;
  }
}
export async function readDocument(uid, documentId) {
  try {
    await connect();
    const document = await collection.findOne({ _id: new ObjectId(documentId), uid });
    console.log(`Document read with _id: ${documentId}`);
    close();
    return document;
  } catch (error) {
    console.error("Error reading documents:", error);
    throw error;
  }
}
export async function createDocument(uid, document) {
  try {
    await connect();
    const result = await collection.insertOne({ uid, ...document });
    console.log(`Document created with _id: ${result.insertedId}`);
    close();
  } catch (error) {
    console.error("Error createDocument :", error);
    throw error;
  }
}


export async function updateDocument(uid, documentId, update) {
  try {
    await connect();
    const result = await collection.updateOne(
      { _id: new ObjectId(documentId), uid },
      { $set: update }
    );
    console.log(`Document updated with _id: ${documentId}`);
    close();
  } catch (error) {
    console.error("Error updateDocument :", error);
    throw error;
  }
}

export async function deleteDocument(uid, documentId) {
  try {
    await connect();
    console.log("uid : ",uid)
    console.log("id : ",documentId)
    const result = await collection.deleteOne({ _id: new ObjectId(documentId), uid });
    console.log(`Document deleted with _id: ${documentId}`);
    close();
  } catch (error) {
    console.error("Error deleteDocument :", error);
    throw error;
  }
}

export async function searchTitle(uid, searchString) {
  try {
    await connect();
    const query = {
      uid,
      title: { $regex: searchString, $options: 'i' }
    };
    const documents = await collection.find(query).toArray();
    console.log(" >> searchTitle <<");
    return documents;
  } catch (error) {
    console.error("Error searching title:", error);
    throw error;
  } finally {
    await close();
  }
}