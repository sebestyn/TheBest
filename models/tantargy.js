var mongoose = require("mongoose");

var UserSchema = new mongoose.Schema({
    nev:String
});


module.exports = mongoose.model("Tantargy", UserSchema);