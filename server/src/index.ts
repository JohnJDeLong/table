import express from "express";
import cors from "cors";
import "./config/env.js";


import { sidebarRouter } from "./routes/sidebarRoutes.js";
import { diagnosticRouter } from "./routes/diagnosticRoutes.js";
import { conversationRouter } from "./routes/conversationRoutes.js";
import { conversationMessageRouter } from "./routes/conversationMessageRoutes.js";
import { healthRouter } from "./routes/healthRoutes.js";



const app = express(); 
const port = Number(process.env.PORT) || 3001; 

app.use(cors({ origin: 'http://localhost:5173'}));
app.use(express.json())


app.use("/api/health", healthRouter);
app.use('/api/sidebar', sidebarRouter);
app.use("/api/diagnostics", diagnosticRouter);
app.use("/api/conversations", conversationRouter);
app.use('/api/conversations', conversationMessageRouter);








app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
