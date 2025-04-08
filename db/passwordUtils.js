const bcrypt = require('bcryptjs');

require('dotenv').config();

async function genPassword(password) {
    const salt = await bcrypt.genSalt(10)
    const genHash = await bcrypt.hash(password, salt);
    return { salt, hash: genHash };
}

module.exports = {genPassword};