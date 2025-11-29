import mongoose from  "mongoose";
const mongoDb = async () : Promise<void> =>{
    try{
        if(!process.env.MONGO_URL) {
            throw new Error("MONGO_URL is not defined in env")
        }

        await mongoose.connect(process.env.MONGO_URL);
        console.log("MongoDB is connected");
    } catch(err){
        console.log("MongoDB connection error:", err);
    }
}

export default mongoDb;
