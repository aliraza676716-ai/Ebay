import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

export interface FolderItem {
  id: string;
  name: string;
  color: string;
  parentId: string | null;
  pin: string;
  isTrash: boolean;
  createdAt: number;
}

export interface ImageItem {
  id: string;
  folderId: string | null;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
  isTrash: boolean;
  tags: string;
  createdAt: number;
}

export interface VaultData {
  app: string;
  version: number;
  lastUpdated: number;
  folders: FolderItem[];
  images: ImageItem[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "vault.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial default seed dataset
const initialSeedData: VaultData = {
  app: "ebya",
  version: 2,
  lastUpdated: Date.now(),
  folders: [
    {
      id: "folder_nature",
      name: "Nature & Landscapes",
      color: "emerald",
      parentId: null,
      pin: "",
      isTrash: false,
      createdAt: Date.now() - 3600000 * 24,
    },
    {
      id: "folder_vault_secret",
      name: "Secure Private Vault",
      color: "rose",
      parentId: null,
      pin: "1234",
      isTrash: false,
      createdAt: Date.now() - 3600000 * 12,
    },
    {
      id: "folder_abstract",
      name: "Abstract & Minimal 3D",
      color: "indigo",
      parentId: null,
      pin: "",
      isTrash: false,
      createdAt: Date.now() - 3600000 * 6,
    },
  ],
  images: [
    {
      id: "img_nature_1",
      folderId: "folder_nature",
      name: "misty_forest_mountain.jpg",
      size: 452000,
      type: "image/jpeg",
      dataUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80",
      isTrash: false,
      tags: "nature, forest, mountains, foggy",
      createdAt: Date.now() - 3600000 * 20,
    },
    {
      id: "img_nature_2",
      folderId: "folder_nature",
      name: "emerald_alpine_lake.jpg",
      size: 618000,
      type: "image/jpeg",
      dataUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
      isTrash: false,
      tags: "lake, reflection, alpine, nature",
      createdAt: Date.now() - 3600000 * 18,
    },
    {
      id: "img_secret_1",
      folderId: "folder_vault_secret",
      name: "private_financial_backup.jpg",
      size: 320000,
      type: "image/jpeg",
      dataUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
      isTrash: false,
      tags: "confidential, vault, secure",
      createdAt: Date.now() - 3600000 * 10,
    },
    {
      id: "img_root_1",
      folderId: null,
      name: "aurora_borealis_night.jpg",
      size: 580000,
      type: "image/jpeg",
      dataUrl: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1200&q=80",
      isTrash: false,
      tags: "aurora, stars, night sky",
      createdAt: Date.now() - 3600000 * 4,
    },
    {
      id: "img_root_2",
      folderId: null,
      name: "cyberpunk_neon_city.jpg",
      size: 740000,
      type: "image/jpeg",
      dataUrl: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80",
      isTrash: false,
      tags: "neon, cyberpunk, wallpaper",
      createdAt: Date.now() - 3600000 * 2,
    },
  ],
};

// Read or initialize file storage
function getVaultData(): VaultData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Error reading data file:", err);
  }
  // If not exist, write seed data
  saveVaultData(initialSeedData);
  return initialSeedData;
}

function saveVaultData(data: VaultData): void {
  try {
    data.lastUpdated = Date.now();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving vault data:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware - generous payload size limit for high-resolution base64 images
  app.use(express.json({ limit: "60mb" }));
  app.use(express.urlencoded({ extended: true, limit: "60mb" }));

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Get full vault data
  app.get("/api/vault", (_req, res) => {
    const data = getVaultData();
    res.json(data);
  });

  // Create folder
  app.post("/api/folders", (req, res) => {
    const { name, color = "indigo", parentId = null, pin = "" } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Folder name is required" });
    }

    const data = getVaultData();
    const newFolder: FolderItem = {
      id: "folder_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      name: String(name).trim(),
      color: String(color).trim(),
      parentId: parentId || null,
      pin: pin ? String(pin).trim() : "",
      isTrash: false,
      createdAt: Date.now(),
    };

    data.folders.push(newFolder);
    saveVaultData(data);
    res.status(201).json(newFolder);
  });

  // Update folder
  app.put("/api/folders/:id", (req, res) => {
    const { id } = req.params;
    const { name, color, parentId, pin, isTrash } = req.body;
    const data = getVaultData();
    const folder = data.folders.find((f) => f.id === id);

    if (!folder) {
      return res.status(404).json({ error: "Folder not found" });
    }

    if (name !== undefined) folder.name = String(name).trim();
    if (color !== undefined) folder.color = String(color).trim();
    if (parentId !== undefined) folder.parentId = parentId || null;
    if (pin !== undefined) folder.pin = pin ? String(pin).trim() : "";
    if (isTrash !== undefined) folder.isTrash = Boolean(isTrash);

    saveVaultData(data);
    res.json(folder);
  });

  // Verify folder PIN
  app.post("/api/folders/:id/verify-pin", (req, res) => {
    const { id } = req.params;
    const { pin } = req.body;
    const data = getVaultData();
    const folder = data.folders.find((f) => f.id === id);

    if (!folder) {
      return res.status(404).json({ error: "Folder not found" });
    }

    if (!folder.pin || folder.pin === "" || folder.pin === String(pin).trim()) {
      return res.json({ verified: true });
    }

    res.status(401).json({ verified: false, error: "Incorrect PIN" });
  });

  // Move folder to Trash or toggle
  app.post("/api/folders/:id/trash", (req, res) => {
    const { id } = req.params;
    const { isTrash = true } = req.body;
    const data = getVaultData();
    const folder = data.folders.find((f) => f.id === id);

    if (!folder) {
      return res.status(404).json({ error: "Folder not found" });
    }

    folder.isTrash = Boolean(isTrash);
    saveVaultData(data);
    res.json(folder);
  });

  // Delete folder permanently
  app.delete("/api/folders/:id", (req, res) => {
    const { id } = req.params;
    const data = getVaultData();
    const idx = data.folders.findIndex((f) => f.id === id);

    if (idx === -1) {
      return res.status(404).json({ error: "Folder not found" });
    }

    data.folders.splice(idx, 1);
    // Also move child photos and folders to root or delete
    data.images = data.images.filter((img) => img.folderId !== id || !img.isTrash);
    saveVaultData(data);
    res.json({ success: true, id });
  });

  // Upload or add image(s)
  app.post("/api/images", (req, res) => {
    const { images } = req.body;
    const data = getVaultData();

    if (Array.isArray(images)) {
      const added: ImageItem[] = [];
      for (const img of images) {
        if (!img.dataUrl) continue;
        const newImg: ImageItem = {
          id: img.id || "img_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
          folderId: img.folderId || null,
          name: img.name || `photo_${Date.now()}.png`,
          size: Number(img.size) || 0,
          type: img.type || "image/png",
          dataUrl: img.dataUrl,
          isTrash: false,
          tags: img.tags || "",
          createdAt: img.createdAt || Date.now(),
        };
        data.images.push(newImg);
        added.push(newImg);
      }
      saveVaultData(data);
      return res.status(201).json(added);
    }

    // Single image
    const { folderId = null, name, size, type, dataUrl, tags = "" } = req.body;
    if (!dataUrl) {
      return res.status(400).json({ error: "Image dataUrl is required" });
    }

    const newImg: ImageItem = {
      id: "img_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      folderId: folderId || null,
      name: name || `photo_${Date.now()}.png`,
      size: Number(size) || 0,
      type: type || "image/png",
      dataUrl,
      isTrash: false,
      tags: tags || "",
      createdAt: Date.now(),
    };

    data.images.push(newImg);
    saveVaultData(data);
    res.status(201).json(newImg);
  });

  // Update image (move folder, update tags, name)
  app.put("/api/images/:id", (req, res) => {
    const { id } = req.params;
    const { name, folderId, tags, isTrash } = req.body;
    const data = getVaultData();
    const img = data.images.find((i) => i.id === id);

    if (!img) {
      return res.status(404).json({ error: "Image not found" });
    }

    if (name !== undefined) img.name = String(name).trim();
    if (folderId !== undefined) img.folderId = folderId || null;
    if (tags !== undefined) img.tags = String(tags);
    if (isTrash !== undefined) img.isTrash = Boolean(isTrash);

    saveVaultData(data);
    res.json(img);
  });

  // Move image to Trash
  app.post("/api/images/:id/trash", (req, res) => {
    const { id } = req.params;
    const { isTrash = true } = req.body;
    const data = getVaultData();
    const img = data.images.find((i) => i.id === id);

    if (!img) {
      return res.status(404).json({ error: "Image not found" });
    }

    img.isTrash = Boolean(isTrash);
    saveVaultData(data);
    res.json(img);
  });

  // Delete image permanently
  app.delete("/api/images/:id", (req, res) => {
    const { id } = req.params;
    const data = getVaultData();
    const idx = data.images.findIndex((i) => i.id === id);

    if (idx === -1) {
      return res.status(404).json({ error: "Image not found" });
    }

    data.images.splice(idx, 1);
    saveVaultData(data);
    res.json({ success: true, id });
  });

  // Empty Recycle Bin
  app.post("/api/trash/empty", (_req, res) => {
    const data = getVaultData();
    const deletedFoldersCount = data.folders.filter((f) => f.isTrash).length;
    const deletedImagesCount = data.images.filter((i) => i.isTrash).length;

    data.folders = data.folders.filter((f) => !f.isTrash);
    data.images = data.images.filter((i) => !i.isTrash);

    saveVaultData(data);
    res.json({
      success: true,
      clearedFolders: deletedFoldersCount,
      clearedImages: deletedImagesCount,
    });
  });

  // Export Backup
  app.get("/api/backup/export", (_req, res) => {
    const data = getVaultData();
    res.setHeader("Content-Disposition", `attachment; filename="ebya-vault-backup-${new Date().toISOString().slice(0, 10)}.json"`);
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(data, null, 2));
  });

  // Import Backup
  app.post("/api/backup/import", (req, res) => {
    const { folders, images } = req.body;
    if (!Array.isArray(folders) || !Array.isArray(images)) {
      return res.status(400).json({ error: "Invalid backup data structure" });
    }

    const data: VaultData = {
      app: "ebya",
      version: 2,
      lastUpdated: Date.now(),
      folders: folders.map((f) => ({
        id: f.id || "folder_" + Date.now(),
        name: f.name || "Untitled Folder",
        color: f.color || "indigo",
        parentId: f.parentId || null,
        pin: f.pin || "",
        isTrash: Boolean(f.isTrash),
        createdAt: f.createdAt || Date.now(),
      })),
      images: images.map((i) => ({
        id: i.id || "img_" + Date.now(),
        folderId: i.folderId || null,
        name: i.name || "image.png",
        size: Number(i.size) || 0,
        type: i.type || "image/png",
        dataUrl: i.dataUrl,
        isTrash: Boolean(i.isTrash),
        tags: i.tags || "",
        createdAt: i.createdAt || Date.now(),
      })),
    };

    saveVaultData(data);
    res.json({ success: true, countFolders: data.folders.length, countImages: data.images.length });
  });

  // Vite middleware in dev / Static dist serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ebya Server running on port ${PORT}`);
  });
}

startServer();
