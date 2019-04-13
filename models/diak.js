var mongoose = require("mongoose");

var UserSchema = new mongoose.Schema({
    nev:String,
    suli:String, //ID
    osztalyok:Array, //ID
    kapott:[{
        nev:String,
        tantargy:String,
        pont:Number
    }]
});


module.exports = mongoose.model("Diak", UserSchema);