import { Response } from "express";
import { AuthenticatedRequest } from "../types";
import contentSearchService from "../services/search/ContentSearchService";
import Content from "../models/Content";

interface FuzzySearchQuery {
  query?: string;
  type?: string;
  limit?: string;
}

interface BookSearchQuery {
  title?: string;
  author?: string;
  genre?: string;
  limit?: string;
}

const searchController = {
  async fuzzySearch(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { query, type = "all", limit = "10" } = req.query as FuzzySearchQuery;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (!query || query.trim() === "") {
        return res.status(400).json({ error: "Search query is required" });
      }

      const results = await contentSearchService.searchUserContent(
        userId,
        query.trim(),
        type,
        parseInt(limit, 10)
      );

      return res.status(200).json({
        query,
        type,
        results,
        totalFound: results.length,
      });
    } catch (error) {
      console.error("Error performing fuzzy search:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },

  async searchBooks(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { title, author, genre, limit = "10" } = req.query as BookSearchQuery;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (!title && !author && !genre) {
        return res.status(400).json({
          error: "At least one search parameter (title, author, or genre) is required",
        });
      }

      const terms = [title, author, genre].filter(Boolean).join(" ");
      const filter: Record<string, unknown> = {
        userId,
        contentType: "book",
      };

      if (terms) {
        const regex = new RegExp(terms.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        filter.$or = [{ title: regex }, { summary: regex }, { tags: regex }];
      }

      const books = await Content.find(filter)
        .sort({ updatedAt: -1 })
        .limit(parseInt(limit, 10))
        .lean();

      return res.status(200).json({
        searchParams: { title, author, genre },
        books: books.map((b) => ({
          id: String(b._id),
          title: b.title,
          author: b.tags?.[0] || "Unknown",
          genre: b.tags?.[1] || "General",
          summary: b.summary,
          available: true,
        })),
        totalFound: books.length,
      });
    } catch (error) {
      console.error("Error searching books:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },
};

export default searchController;
