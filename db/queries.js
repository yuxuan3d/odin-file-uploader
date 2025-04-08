const { PrismaClient } = require('../generated/prisma')

require('dotenv').config();

const prisma = new PrismaClient()

async function getAllUsers() {
    const allUsers = await prisma.user.findMany()
    console.log(allUsers)
    return allUsers
}

async function findUserByUsername(username) {
    const user = await prisma.user.findUnique({
        where: {
            username: username
        }
    })
    return user
}

async function createUser(username, password, salt) {
    try {
        const user = await prisma.user.create({
            data: {
                username: username,
                password: password,
                salt: salt
            }
        })
        return user
    } catch (err) {
        console.error('Error creating user:', err);
        throw err; // Re-throw the error to be handled by the caller
    }
}

// async function createUser(fName, lName, username, password, membership, salt,isAdmin) {
//     const client = await pool.connect();
//     try {
//       const result = await client.query(
//         'INSERT INTO users (first_name, last_name, username, password, membership_status,salt,isadmin) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
//         [fName, lName, username, password, membership, salt,isAdmin]
//       );
//       return result.rows[0];
//     } catch (err) {
//       console.error('Error creating user:', err);
//       throw err; // Re-throw the error to be handled by the caller
//     } finally {
//       client.release();
//     }
//   }

// async function getAllMessages() {
//   const { rows } = await pool.query("SELECT * FROM posts");
//   return rows;
// }

// async function findUserByUsername(username) {
//     const client = await pool.connect();
//     try {
//         const result = await client.query(
//         'SELECT * FROM users WHERE username = $1',
//         [username]
//         );
//         console.log(result.rows)
//         return result.rows;
//     } catch (err) {
//         throw err;
//     } finally {
//         client.release();
//     }
// }

// async function checkUserExist(username) {
//     const client = await pool.connect();
//     try {
//         const result = await client.query(
//         'SELECT * FROM users WHERE username = $1 LIMIT 1',
//         [username]
//         );
//         return result.rows.length > 0
//     } catch (err) {
//         console.error("Error in checkUserExist:", err); 
//         throw err;
//     } finally {
//         client.release();
//     }
// }

// async function findUserById(id) {
//   const client = await pool.connect();
//   try {
//       const result = await client.query(
//       'SELECT * FROM users WHERE id = $1',
//       [id]
//       );
//       return result.rows[0];
//   } catch (err) {
//       throw err;
//   } finally {
//       client.release();
//   }
// }

// async function deleteQuery(id) {
//     const client = await pool.connect();
//     console.log(id)
//     try {
//         const result = await client.query(
//             'DELETE FROM posts WHERE id = $1',
//             [id]
//         );
//         return result
//     } catch (err) {
//         throw err;
//     } finally {
//         client.release();
//     }
// }

module.exports = {
    getAllUsers,
    findUserByUsername,
    createUser
};
