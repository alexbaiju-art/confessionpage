import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase Client Initialization
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
app.use(express.json());

const PORT = 3000;

// Simple profanity filter
const badWords = ["fuck", "shit", "asshole", "bitch", "cunt"]; // Minimal list for demo
function filterProfanity(text: string) {
  let filtered = text;
  badWords.forEach(word => {
    const regex = new RegExp(word, "gi");
    filtered = filtered.replace(regex, "*".repeat(word.length));
  });
  return filtered;
}

// API Routes
app.get("/api/confessions", async (req, res) => {
  const requestedSort = req.query.sort === "likes" ? "like" : "created_at";
  
  try {
    // 1. Try preferred sort
    let { data, error } = await supabase
      .from("confession")
      .select("*")
      .order(requestedSort, { ascending: false });

    // 2. If 'created_at' sort failed, it's likely the column is missing. Try 'id' as fallback for "Newest"
    if (error && requestedSort === "created_at") {
      const retryId = await supabase
        .from("confession")
        .select("*")
        .order("id", { ascending: false });
      
      if (!retryId.error) {
        data = retryId.data;
        error = null;
      }
    }

    // 3. If still error or if 'likes' sort failed, try fetching without any order
    if (error) {
      const fallback = await supabase
        .from("confession")
        .select("*");
      
      if (fallback.error) {
        console.error("Supabase fetch error:", JSON.stringify(fallback.error, null, 2));
        return res.status(500).json({ error: fallback.error.message });
      }
      
      data = fallback.data;
      
      // Manual sort in memory if requested
      if (data) {
        const sortCol = req.query.sort === "likes" ? "like" : "id";
        data.sort((a: any, b: any) => {
          const valA = a[sortCol] || 0;
          const valB = b[sortCol] || 0;
          return typeof valB === 'number' ? valB - (valA as number) : String(valB).localeCompare(String(valA));
        });
      }
    }

    res.json(formatConfessions(data || []));
  } catch (err: any) {
    console.error("Server exception during fetch:", err);
    res.status(500).json({ error: err.message });
  }
});

function formatConfessions(data: any[]) {
  return data.map((c: any, index: number) => ({
    id: c.id !== undefined && c.id !== null ? c.id : index,
    anonymous_name: c.anonymous_name || "Anonymous",
    confession_text: c.confession,
    likes_count: c.like || 0,
    created_at: c.created_at || new Date().toISOString()
  }));
}

app.post("/api/confessions", async (req, res) => {
  const { text, name } = req.body;
  console.log(`Received new confession from ${name}`);
  
  if (!text || text.length < 10 || text.length > 500) {
    return res.status(400).json({ error: "Confession must be between 10 and 500 characters." });
  }

  const filteredText = filterProfanity(text);
  
  try {
    const { data, error } = await supabase
      .from("confession")
      .insert([
        { 
          confession: filteredText, 
          like: 0 
        }
      ])
      .select();

    if (error) {
      console.error("Supabase insert error:", JSON.stringify(error, null, 2));
      return res.status(500).json({ error: error.message });
    }

    console.log("Successfully inserted confession into Supabase");
    if (!data || data.length === 0) {
      console.warn("Supabase insert succeeded but returned no data (check RLS)");
      return res.json({ id: Date.now(), text: filteredText, name });
    }
    
    res.json({ id: data[0].id, text: filteredText, name });
  } catch (err: any) {
    console.error("Server exception during insert:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/confessions/:id/like", async (req, res) => {
  const { id } = req.params;
  
  // Fetch current likes
  const { data: confession, error: fetchError } = await supabase
    .from("confession")
    .select("like")
    .eq("id", id)
    .single();

  if (fetchError || !confession) {
    return res.status(404).json({ error: "Confession not found" });
  }

  const { error: updateError } = await supabase
    .from("confession")
    .update({ like: (confession.like || 0) + 1 })
    .eq("id", id);

  if (updateError) {
    return res.status(500).json({ error: updateError.message });
  }
    
  res.json({ success: true });
});

app.delete("/api/confessions/:id", async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from("confession")
    .delete()
    .eq("id", id);
  
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  
  res.json({ success: true });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
