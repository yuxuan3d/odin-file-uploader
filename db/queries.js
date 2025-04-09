const { PrismaClient } = require('../generated/prisma')
const path = require('path');
const fs = require('fs').promises; 

require('dotenv').config();

const prisma = new PrismaClient()

async function getAllUsers() {
    const allUsers = await prisma.user.findMany()
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

async function findUserById(id) {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: id
            }
        })
        return user
    } catch (err) {
          throw err;}
}

async function createFileRecord(originalName, storagePath, size, mimeType, userId, parentId) {
    try {

        const file = await prisma.file.create({
            data: {
                originalName: originalName,
                storagePath: storagePath,
                size: size,
                mimeType: mimeType,
                isFolder: false,
                userId: userId,
                parentId: parentId ? parseInt(parentId, 10) : null 
            }
        })
        console.log("Created file: ", file)
        return file
    } catch (err) {
        console.error('Error creating file:', err);
        throw err; // Re-throw the error to be handled by the caller
    }
}

async function createFolderRecord(folderName, userId, parentId) {
    try {

        const folder = await prisma.file.create({
            data: {
                originalName: folderName,
                isFolder: true,
                storagePath: null,
                size: null,
                mimeType: null,
                userId: userId,
                parentId: parentId ? parseInt(parentId, 10) : null 
            }
        })
        console.log("Created folder: ", folder)
        return folder
    } catch (err) {
        console.error('Error creating folder:', err);
        throw err; // Re-throw the error to be handled by the caller
    }
}

async function getFolderContents(userId, parentId) {
    try {
        const contents = await prisma.file.findMany({
            where: {
                userId: userId,
                parentId: parentId ? parseInt(parentId, 10) : null
            },
            orderBy: [
                { isFolder: 'desc' }, // Show folders first
                { originalName: 'asc' } // Then sort alphabetically
            ]
        });
        return contents;
    } catch (err) {
        console.error('Error getting folder contents:', err);
        throw err;
    }
}

async function getFolderDetails(folderId, userId) {
    if (!folderId) return null
    try {
        const folder = await prisma.file.findUnique({
            where: {
                id: parseInt(folderId, 10),
                userId: userId, // Ensure user owns the folder
                isFolder: true  // Ensure it's actually a folder
            },
            include: {
                parent: true // Include parent details for breadcrumbs/up link
            }
        });
        return folder;
    } catch (err) {
        console.error('Error getting folder details:', err);
        throw err;
    }
}

/**
 * Finds a file/folder by ID and User ID (for ownership check).
 */
async function findItemByIdAndUser(itemId, userId) {
    try {
        const item = await prisma.file.findUnique({
            where: {
                id: parseInt(itemId, 10),
                userId: userId, // Ensure the item belongs to the user
            }
        });
        return item;
    } catch (err) {
        console.error('Error finding item by ID and User:', err);
        throw err; // Re-throw the error
    }
}

/**
 * Renames a file or folder.
 */
async function renameItem(itemId, newName, userId) {
    try {
        // Note: The unique constraint @@unique([userId, parentId, originalName])
        // should prevent renaming to an existing name in the same folder.
        const updatedItem = await prisma.file.update({
            where: {
                id: parseInt(itemId, 10),
                userId: userId // Ensure user owns the item
            },
            data: {
                originalName: newName
            }
        });
        console.log("Item renamed:", updatedItem);
        return updatedItem;
    } catch (err) {
        console.error('Error renaming item:', err);
        throw err;
    }
}

async function deleteItem(itemId, userId) {
    try {
        // 1. Find the item first to get its path (if it's a file) and check ownership
        const itemToDelete = await prisma.file.findUnique({
            where: {
                id: parseInt(itemId, 10),
                userId: userId // IMPORTANT: Check ownership
            }
        });

        if (!itemToDelete) {
            throw new Error("Item not found or user does not have permission.");
        }

        // 2. Delete the DB record (Prisma handles cascade for children)
        const deletedItem = await prisma.file.delete({
            where: {
                id: parseInt(itemId, 10)
                // Ownership already checked above
            }
        });
        console.log("Item deleted from DB:", deletedItem);

         // 3. If it was a file (not a folder) and had a storage path, delete the physical file
         if (!itemToDelete.isFolder && itemToDelete.storagePath) {
            try {
                await fs.unlink(path.resolve(itemToDelete.storagePath)); // Adjust path if needed
                console.log("Physical file deleted:", itemToDelete.storagePath);
            } catch (unlinkErr) {
                // Log error but don't necessarily fail the whole operation
                // if the DB record was deleted successfully.
                console.error("Error deleting physical file (DB record deleted):", unlinkErr);
            }
        }
        return deletedItem;
    } catch (err) {
        console.error('Error deleting item:', err);
        throw err;
    }
}

module.exports = {
    getAllUsers,
    findUserByUsername,
    createUser,
    findUserById,
    createFileRecord,
    createFolderRecord,
    getFolderContents,
    getFolderDetails,
    findItemByIdAndUser,
    renameItem,
    deleteItem
};
