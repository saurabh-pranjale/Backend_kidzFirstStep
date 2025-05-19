const mongoose = require('mongoose');



const connectionDB = () =>{
    try {
        mongoose.connect(process.env.mongo_db);
        console.log("database connected successfully 🔥")
    } catch (error) {
        console.log(error)
    }
}

module.exports = connectionDB;