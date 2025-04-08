const bcrypt = require('bcryptjs');

require('dotenv').config();

// TODO
function validPassword(password, hash, salt) {
    const hashVerify = bcrypt.hash(password, salt);
    return hash === hashVerify;
}

async function genPassword(password) {
    const salt = await bcrypt.genSalt(10)
    const genHash = await bcrypt.hash(password, salt);
    return { salt, hash: genHash };
}

module.exports = {validPassword, genPassword};