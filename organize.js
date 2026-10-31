
import fs from "fs/promises";
import path from "path";

// 1. Select the directory you want to organize
const targetDir = process.argv[2];

async function organizeFiles() {

    // Check whether directory is provided
    if (!targetDir) {
        throw new Error("Please provide a directory path.");
    }

    const resolvedTargetDir = path.resolve(targetDir);
    const targetStats = await fs.stat(resolvedTargetDir).catch((error) => {
        if (error.code === "ENOENT") {
            throw new Error(`Directory does not exist: ${resolvedTargetDir}`);
        }

        throw error;
    });

    if (!targetStats.isDirectory()) {
        throw new Error(`The provided path is not a directory: ${resolvedTargetDir}`);
    }

    // 2. Read all contents of the directory
    const files = await fs.readdir(resolvedTargetDir, {
        withFileTypes: true
    });

    // 3. Define file categories
    const categories = {
        Images: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
        Documents: [".pdf", ".doc", ".docx", ".txt", ".pptx", ".xlsx"],
        Videos: [".mp4", ".mkv", ".avi"],
        Music: [".mp3", ".wav"],
        Archives: [".zip", ".rar", ".7z"],
        Code: [".js", ".html", ".css", ".py", ".java"]
    };

    // 4. Process every file
    for (const file of files) {

        // Skip folders
        if (file.isDirectory()) {
            continue;
        }

        // Get file extension
        const extension = path.extname(file.name).toLowerCase();

        // Find matching category
        let category = "Others";

        for (const [folder, extensions] of Object.entries(categories)) {
            if (extensions.includes(extension)) {
                category = folder;
                break;
            }
        }

        // 5. Create destination folder
        const destinationFolder = path.join(resolvedTargetDir, category);

        await fs.mkdir(destinationFolder, {
            recursive: true
        });

        // 6. Create source and destination paths
        const oldPath = path.join(resolvedTargetDir, file.name);
        let newPath = path.join(destinationFolder, file.name);

        // Avoid overwriting files with the same name
        let count = 1;

        while (true) {
            try {
                await fs.access(newPath);
                const parsed = path.parse(file.name);

                newPath = path.join(
                    destinationFolder,
                    `${parsed.name}_${count}${parsed.ext}`
                );

                count++;
            } catch (error) {
                if (error.code === "ENOENT") {
                    break;
                }

                throw error;
            }
        }

        // 7. Move file
        await fs.rename(oldPath, newPath);

        console.log(`${file.name} moved to ${category}`);
    }

    console.log("File organization completed!");
}

// Run the function
organizeFiles().catch((error) => {
    console.error(`File organization failed: ${error.message}`);
    process.exitCode = 1;
});
