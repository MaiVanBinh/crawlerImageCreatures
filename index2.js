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
    if (img?.includes("imagepath")) {
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

  const myColl = myDB.collection("image1");
  const errColl = myDB.collection("err");
  const docs = await errColl.find().toArray()
  for (let i = 0; i < docs.length; i++) {
    const listImage = await getLinkImage(docs[i].link);
    for (let j = 0; j < listImage.length; j++) {
      let item = listImage[j]
      const doc = { ...item, creatureId: docs[i].creatureId };
      console.log("doc", doc)
      await myColl.insertOne(doc);
    }
  }
}
run().catch(console.dir);
