
// Global type declarations for Next.js and MongoDB
import { MongoClient } from 'mongodb';

declare global {
  var _mongoClientPromise: Promise<MongoClient>;
  var mongoose: {
    conn: any;
    promise: any;
  };
}

export {};
