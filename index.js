const express = require("express");
const { getToken, verifyToken } = require("./jwt");
const { connectTodb, getDb } = require("./dbconnection");
const bcrypt = require("bcrypt");
const cors = require("cors");
const bodyParser = require('body-parser');
const app = express();
const {Server}=require('socket.io');
let db;

app.use(cors());

app.use(express.json());

app.use(bodyParser.json());

let server;

const PORT = process.env.PORT || 10000;

connectTodb((err) => {
  if (!err) {
      server = app.listen(PORT, () => {
      console.log("server running on port: ", PORT);
      IoServer();
    });
    db = getDb();

    console.log("connected to db");
  }
});

app.post("/login",checkUsers,generateToken);


async function checkUsers(req, res, next) {
  const user = req.body;
  let validated = false;

  try {
    // Fetch all existing users from the database
    const cursor = db.collection('users').find();
    await cursor.forEach(existingUser => {
      if (bcrypt.compareSync(user.password, existingUser.password) && 
          user.username.toLowerCase() === existingUser.username.toLowerCase()) {
        validated = true;
        req.body = { username: req.body.username, _id: existingUser._id };
      }
    });

    // After processing all users, check if the user is validated
    if (validated) {
      next();
    } else {
      res.status(200).json({
        message: "Invalid user"
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
//token generator
function generateToken(req, res) {
  const object = req.body;
  const token = getToken(object);
  res.status(200).json(token);
}

app.post("/register",checkexistingUser, async(req, res) => {
  const user = req.body;
  
  const hashedpw = await bcrypt.hash(user.password, 10);

  const newUser = {
    username: user.username,
    password: hashedpw,
  };

  db.collection("users").insertOne(newUser).then((result) =>{
    res.status(201);
    res.json(result);
   }).catch(err=>{
    res.status(500);
    res.json(err)
   }
   );
});


//check for existing user
function checkexistingUser(req,res,next){
  const user = req.body;
  let validated = false;
  db.collection('users').find().forEach(existingUser => {
    if(bcrypt.compare(user.password,existingUser.password) && user.username.toLowerCase() == existingUser.username.toLowerCase()){
      validated = true;
    }
    else{
      validated = false;
    }
  }).then(()=>{
    if(validated){
      
      res.status(200);
      res.json({
        message : "user already registered"
      })
      
    }
    else{
      next();
    }
}).catch(err=>{
    res.json(err);
});
}


app.get("/data", authorizeToken, (req, res) => {
  res.json(req.user);
  db.collection("users");
});

function authorizeToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}


//chat message server
function IoServer(){
  console.log("io.connected")
  const io = new Server(server, {
    cors: {
      origin: true,
    }
  });
  
  io.on("connection",(socket)=>{
    console.log("connection made : ",socket.id);
    
    socket.on("message",data=>{
      socket.broadcast.emit("incommingMessage",data);
    })
  })
}
