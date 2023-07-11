const { default: axios } = require("axios");
const cheerio = require("cheerio");
var mysql = require("mysql");
const util = require("util");

var conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "vncreatures",
});

const query = util.promisify(conn.query).bind(conn);

const { MongoClient, ServerApiVersion } = require("mongodb");

//Create a database named "mydb":
var url = "mongodb://localhost:27017/mydb";

async function run() {
  const client = await new MongoClient(url, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
  const myDB = client.db("creature");

  const myColl2 = myDB.collection("image");
  const errColl = myDB.collection("err");
  let docs = [];
  let limit = 1;
  let i = 0;
  let count = 0;
  do {
    try {
      docs = await myColl2.find().limit(limit).skip(i).toArray();
      i++;
      count += docs.length;
      if(docs.length > 0) {
        rows = await query(
          `SELECT * FROM assets where url like "%${docs[0].imageName}%";`
        );
        if (rows?.[0]) {
          await query(
            `UPDATE assets SET author_name="${docs?.[0]?.author}" WHERE id = ${rows?.[0].id}`
          );
        }
        console.log(rows?.[0]);
      }
    } catch (err) {
      console.log("Err", i, err);
    }
  } while (docs.length > 0);
}
run().catch(console.dir);
