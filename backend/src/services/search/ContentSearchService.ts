import Content from "../../models/Content";
import mongoose from "mongoose";

export interface ContentSearchHit {
  id: string;
  title: string;
  type: string;
  summary: string;
  tags: string[];
  relevanceScore: number;
}

export class ContentSearchService {
  async searchUserContent(
    userId: string,
    query: string,
    type?: string,
    limit = 10
  ): Promise<ContentSearchHit[]> {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    const filter: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(userId),
      $or: [{ title: regex }, { summary: regex }, { tags: regex }],
    };

    if (type && type !== "all") {
      filter.contentType = type;
    }

    const rows = await Content.find(filter)
      .sort({ updatedAt: -1 })
      .limit(safeLimit)
      .lean();

    return rows.map((row) => ({
      id: String(row._id),
      title: row.title,
      type: row.contentType,
      summary: row.summary,
      tags: row.tags || [],
      relevanceScore: 1,
    }));
  }
}

const contentSearchService = new ContentSearchService();
export default contentSearchService;
