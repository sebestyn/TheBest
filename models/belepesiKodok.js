var mongoose = require("mongoose");

var UserSchema = new mongoose.Schema({
    kod:Number
});


module.exports = mongoose.model("BelepesiKodok", UserSchema);