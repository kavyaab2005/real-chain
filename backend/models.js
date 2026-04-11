const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  email:         { type: String, required: true, unique: true, lowercase: true },
  password:      { type: String, required: true, minlength: 6 },
  bio:           { type: String, default: "" },
  phone:         { type: String, default: "" },
  city:          { type: String, default: "" },
  profilePhoto:  { type: String, default: "" },
  walletAddress: { type: String, default: "", lowercase: true },
  role:          { type: String, enum: ["buyer","seller","both"], default: "both" },
  createdAt:     { type: Date,   default: Date.now },
});

userSchema.pre("save", async function() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function(pwd) {
  return bcrypt.compare(pwd, this.password);
};

module.exports = mongoose.model("User", userSchema);