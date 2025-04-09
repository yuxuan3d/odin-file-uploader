const db = require("../db/queries");
const {genPassword} = require("../db/passwordUtils");
const { body, validationResult } = require('express-validator');


async function triggerHomeOrFolderView(req, res) {
  if (!req.isAuthenticated()) {
    // If trying to access a specific folder while logged out, redirect (optional)
     if (req.params.folderId) {
         console.log("Attempt to access specific folder while logged out.");
         return res.redirect('/'); // Redirect to root/login page
     }
    // If on the root path ('/') and not logged in, show the login part of index.ejs
    console.log("User not authenticated, rendering login view on '/'");
    return res.render("index", {
        title: "Login", // Set appropriate title
        user: null, // Explicitly pass null for user
        items: [], // Pass empty array or null for items
        currentFolder: null,
        currentFolderId: null
    });
  }
  
  try {
    const userId = req.user.id;
    const folderId = req.params.folderId || null;

    const items = await db.getFolderContents(userId, folderId);

    const currentFolder = folderId ? await db.getFolderDetails(folderId, userId) : null;

    if (folderId && !currentFolder) {
      // If a folderId was specified but not found (or not owned by user), handle it
      // For example, redirect to root or show an error
       console.log(`Folder not found or permission denied for folderId: ${folderId}, userId: ${userId}`);
       return res.redirect('/'); // Redirect to root as a fallback
    }

    res.render("index", { // Reusing index.ejs, passing more data
      title: currentFolder ? currentFolder.originalName : "My Files",
      user: req.user,
      items: items, // Files and folders in the current directory
      currentFolder: currentFolder, // Info about the current folder (null for root)
      currentFolderId: folderId // Pass the ID for forms
    });
  } catch (error) {
    console.error("Error rendering home/folder view:", error);
    next(error); // Pass error to error handling middleware
  }
}

async function checkUserExist(username) {
    const user = db.findUserByUsername(username)
    return user
}

async function newUser(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      console.error("Validation errors:", errors.array());
      // Handle errors (e.g., re-render form)
      return res.status(422).render('signup', {
          errors: errors.array(),
      });
    }

    try {
      const username = req.body.username;
      const password = await genPassword(req.body.password);
      db.createUser(username, password)
      res.redirect("/");
    } catch (error) {
      console.error(error);
      next(error);
    }
}

async function handleFileUpload(req, res, next) {
  if (!req.file) {
    // Handle case where no file was uploaded (e.g., show error)
    // You might want flash messages here
    console.log("No file uploaded.");
    // Redirect back to the folder they were trying to upload to
    const parentFolderId = req.body.parentId || ''; // Get parentId from hidden form field
    return res.redirect(parentFolderId ? `/folder/${parentFolderId}` : '/');
  }

  try {
    const { originalname, path: storagePath, size, mimetype } = req.file
    const userId = req.user.id
    const parentId = req.body.parentId || null

    await db.createFileRecord(originalname, storagePath, size, mimetype, userId, parentId)

    console.log(`File ${originalname} uploaded to parent ${parentId || 'root'}`);
        // Redirect back to the folder where the file was uploaded
    res.redirect(parentId ? `/folder/${parentId}` : '/');
  } catch (error) {
    console.error("Error handling file upload:", error);
    next(error);
  }
}

async function handleCreateFolder(req, res, next) {
  try {
      const { folderName, parentId } = req.body; // Get from form
      const userId = req.user.id;

      if (!folderName || folderName.trim().length === 0) {
          // Handle empty folder name error (e.g., flash message)
          console.log("Folder name cannot be empty.");
          return res.redirect(parentId ? `/folder/${parentId}` : '/');
      }

      await db.createFolderRecord(folderName.trim(), userId, parentId);

      console.log(`Folder ${folderName} created in parent ${parentId || 'root'}`);
      // Redirect back to the parent folder where the new folder was created
      res.redirect(parentId ? `/folder/${parentId}` : '/');

  } catch (error) {
      // Handle potential unique constraint errors (duplicate name in same folder)
      if (error.code === 'P2002') { // Prisma unique constraint violation code
           console.log("Folder name already exists in this location.");
          // Add flash message here ideally
      } else {
          console.error("Error creating folder:", error);
      }
       const parentId = req.body.parentId || null;
       res.redirect(parentId ? `/folder/${parentId}` : '/'); // Redirect back even on error
      // next(error); // Or pass to a generic error handler
  }
}

async function triggerRenameForm(req, res, next) {
  try {
      const itemId = req.params.itemId;
      const userId = req.user.id;
      const item = await db.findItemByIdAndUser(itemId, userId);

      if (!item) {
          console.log(`Rename attempt: Item ${itemId} not found for user ${userId}`);
          return res.redirect(req.headers.referer || '/'); // Redirect back
      }

      res.render('rename', { // Create a simple rename.ejs view
          user: req.user,
          item: item,
          error: null // Or pass flash messages
      });
  } catch (error) {
      console.error("Error triggering rename form:", error);
      next(error);
  }
}

async function handleRenameItem(req, res, next) {
  try {
      const itemId = req.params.itemId;
      const { newName } = req.body;
      const userId = req.user.id;

      if (!newName || newName.trim().length === 0) {
          console.log("New name cannot be empty.");
           // Redirect back to where they were, maybe with error message
           // Need item details to know the parent folder for redirect
           const item = await db.findItemByIdAndUser(itemId, userId);
           const redirectPath = item?.parentId ? `/folder/${item.parentId}` : '/';
           return res.redirect(redirectPath);
      }

      const item = await db.renameItem(itemId, newName.trim(), userId);

      console.log(`Item ${itemId} renamed to ${newName}`);
      // Redirect back to the parent folder of the renamed item
      res.redirect(item.parentId ? `/folder/${item.parentId}` : '/');

  } catch (error) {
      const itemId = req.params.itemId;
      const userId = req.user.id;
       if (error.code === 'P2002') {
          console.log("An item with that name already exists in this folder.");
           // Add flash message
      } else {
           console.error("Error renaming item:", error);
       }
       // Try to redirect back intelligently
       try {
          const item = await db.findItemByIdAndUser(itemId, userId);
          res.redirect(item?.parentId ? `/folder/${item.parentId}` : '/');
       } catch {
           res.redirect('/'); // Fallback redirect
       }
      // next(error);
  }
}
  
  async function handleDeleteItem(req, res, next) {
    try {
        const itemId = req.params.itemId;
        const userId = req.user.id;

        // Find the item first to know its parent for redirection
        const itemToDelete = await db.findItemByIdAndUser(itemId, userId);
        if (!itemToDelete) {
             console.log(`Delete attempt: Item ${itemId} not found for user ${userId}`);
             return res.redirect(req.headers.referer || '/'); // Redirect back
        }
        const parentId = itemToDelete.parentId; // Store parent ID before deleting

        await db.deleteItem(itemId, userId);

        console.log(`Item ${itemId} deleted`);
        // Redirect back to the parent folder
        res.redirect(parentId ? `/folder/${parentId}` : '/');

    } catch (error) {
        console.error("Error deleting item:", error);
        res.redirect(req.headers.referer || '/'); // Redirect back on error
        // next(error);
    }
}

module.exports = {
  triggerHomeOrFolderView,
  checkUserExist,
  newUser,
  handleFileUpload,
  handleCreateFolder,
  triggerRenameForm,
  handleRenameItem,
  handleDeleteItem
}