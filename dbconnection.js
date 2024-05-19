require('dotenv').config();
dbconnectionkey = process.env.dbconnectionkey;
const {MongoClient} = require('mongodb');

let dbCollection;
module.exports = {
    connectTodb : (cb)=>{
        MongoClient.connect(dbconnectionkey).then(
            (client)=> {
                dbCollection = client.db('userdata');
                cb()
            }
        ).catch(err=>{
            cb(err);
        })
    },
    getDb : ()=> dbCollection
}