import mongoose from "mongoose";
import {DB_NAME} from "../constants.js"
import { error } from "console";

const connectDB = async ()=>{
    try {
         const connectionInstance =   await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`) //Mongoose returns an object.
         console.log(`\n MongoDb is connected!! Connection Host: 
            ${connectionInstance.connection.host}`)

    }catch (error){
        console.log("Mongo DB Connection failed", error)
        process.exit(1);
    }
}

export default connectDB