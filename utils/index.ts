const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


// Utility functions
export async function GenerateSalt() {
  return await bcrypt.genSalt();
}

// export async function GeneratePassword(password, salt) {
//   return await bcrypt.hash(password, salt);
// }

// export async function ValidatePassword(enteredPassword, savedPassword, salt) {
//   return (await this.GeneratePassword(enteredPassword, salt)) === savedPassword;
// }

export async function GenerateSignature(payload:object) {
  try {
    return await jwt.sign(payload, process.env.JWT_SECRET_KEY as string, { expiresIn: "30d" });
  } catch (error) {
    console.log(error);
    return error;
  }
}
