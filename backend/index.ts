import express from "express";
// import session from "express-session";
// import passport from "./src/middleware/passport";

// Extensions
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import errorHandler from "./src/middleware/errorHandler";
import notFoundHandler from "./src/middleware/notFoundHandler";

// Routers
import apiDocRouter from "./src/documentation/apiDoc";
import adRouter from "./src/routes/ad";
import authRouter from "./src/routes/auth";
import summaryRouter from "./src/routes/summary";
import pdfRouter from "./src/routes/pdf";
import searchRouter from "./src/routes/search";
import tokenRouter from "./src/routes/token";
import fileRouter from "./src/routes/file";
import contentRouter from "./src/routes/content";
import userRouter from "./src/routes/user";

import dotenv from "dotenv";
dotenv.config();

import "./db"; // Import the db connection

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan("combined"));
app.use(express.json({ limit: "1mb" }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Session configuration
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: true,
//   })
// );

// Initialize Passport
// app.use(passport.initialize());
// app.use(passport.session());

// Routes
app.use("/api/docs", apiDocRouter);
app.use("/api/ad", adRouter);
app.use("/api/auth", authRouter);
app.use("/api/summary", summaryRouter);
app.use("/api/pdf", pdfRouter);
app.use("/api/search", searchRouter);
app.use("/api/token", tokenRouter);
app.use("/api/file", fileRouter);
app.use("/api/content", contentRouter);
app.use("/api/user", userRouter);

// Root route for health check
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "SumItUp Backend is running successfully!",
    timestamp: new Date().toISOString()
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

// Server Initialization
const PORT: number = parseInt(process.env.PORT || "3000", 10);
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
