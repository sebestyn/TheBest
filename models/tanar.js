var mongoose = require("mongoose");

var UserSchema = new mongoose.Schema({
    suli:String, //ID
    nev:String
});


module.exports = mongoose.model("Tanar", UserSchema);