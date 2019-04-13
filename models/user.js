var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    teacher: Boolean,
    suli:String, //ID
    nev:String,
    osztalyok:Array, //ID
    kapott:[{
        nev:String,
        tantargy:String,
        pont:Number,
        mikor:String
    }]
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);