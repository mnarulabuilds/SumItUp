import express from "express";
import searchController from "../controllers/search";
import authMiddleware from "../middleware/auth";
import asyncHandler from "../lib/http/asyncHandler";

const router = express.Router();

router.use(authMiddleware as express.RequestHandler);

router.get("/fuzzy", asyncHandler(searchController.fuzzySearch as express.RequestHandler));
router.get("/books", asyncHandler(searchController.searchBooks as express.RequestHandler));

export default router;
