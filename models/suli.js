var mongoose = require("mongoose");

var UserSchema = new mongoose.Schema({
    nev:String,
    osztalyok:[{
        nev:String,
        kod:Number,
        tantargyak:[{
            nev:String,
            tanar:String, 
            tanarId:String, //ID
            diakok:[{
                nev:String,
                userId:{
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User"
                },
                pont:Number,
                kapott:[{
                    feladat_id:String,
                    nev:String,
                    tantargy:String,
                    mikor:String,
                    pont:Number
                }]
            }]
        }]
    }]
});


module.exports = mongoose.model("Suli", UserSchema);