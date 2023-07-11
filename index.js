const { default: axios } = require("axios");
const cheerio = require("cheerio");
var mysql = require("mysql");
const util = require('util');

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, 1000));
} 

const getLink = (creature) => {
  return `http://www.vncreatures.net/chitiet.php?page=1&loai=${creature.species}&ID=${creature.id}`;
};

const getLinkImage = async (link) => {
  const listImage = [];
  const res = await axios.get(link);
  const $ = cheerio.load(res.data);
  const imagesEls = $("tbody").find("a");
  for (let i = 0; i < imagesEls.length; i++) {
    let img = $(imagesEls[i]).attr("href");
    if (img.includes("imagepath")) {
      const arr = img.split("&");
      const author = arr[2].split("=")[1];
      const imageArr = arr[3].split("/");
      const imageName =
        imageArr[imageArr.length - 2] +
        "/" +
        imageArr[imageArr.length - 1].split("'")[0];
      listImage.push({
        author,
        imageName,
      });
    }
  }
  return listImage;
};

var conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "vncreatures1",
});
const query = util.promisify(conn.query).bind(conn);

const { MongoClient, ServerApiVersion } = require("mongodb");
//Create a database named "mydb":
var url = "mongodb://localhost:27017/mydb";

async function run() {
  // con = await con.connect();
  const limit = 5;
  let offset = 5
  let i = 0;
  let rows = []
  let count = 0;
  const client = await new MongoClient(url, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
  const myDB = client.db("creature");
  const myColl = myDB.collection("image");
  const errColl = myDB.collection("err");

  do {
    rows = await query(`SELECT * FROM creatures limit ${limit} offset ${offset * i};`)
    count += rows.length
    for (let i = 0; i < rows.length; i++) {
      await delay();
      let creature = rows[i];
      const link = getLink(creature)

      try {
        const listImage = await getLinkImage(link);
        for (let j = 0; j < listImage.length; j++) {
          let item = listImage[j]
          const doc = { ...item, creatureId: creature.id };
          console.log("doc", doc)
          await myColl.insertOne(doc);
        }
      } catch (err) {
        const doc = { link, creatureId: creature.id };
        console.log("ERR", doc)
        await errColl.insertOne(doc);
      }
    }
    console.log(count, rows.length);
    i++
  } while(rows.length)

  client.close();
}
run().catch(console.dir);
