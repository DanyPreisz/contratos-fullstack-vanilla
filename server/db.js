import { MongoClient, ObjectId } from "mongodb";
const uri = process.env.MONGODB_URI || "";
const dbName = process.env.MONGODB_DB || "contratos";
let db;
export function isReady() { return Boolean(db); }
export async function connect() {
  if (!uri) throw new Error("Falta MONGODB_URI");
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
  await client.connect();
  db = client.db(dbName);
  await db.collection("users").createIndex({ username: 1 }, { unique: true });
  await db.collection("contracts").createIndex({ userId: 1, updatedAt: -1 });
  console.log(`MongoDB conectado (${dbName})`);
  return db;
}
export const users = () => db.collection("users");
export const contracts = () => db.collection("contracts");
export function toId(value) { return ObjectId.isValid(value) ? new ObjectId(String(value)) : null; }
export function mapContract(doc) { return { id: String(doc._id), title: doc.title, partyA: doc.partyA, partyB: doc.partyB, object: doc.object, amount: doc.amount, day: doc.day }; }
