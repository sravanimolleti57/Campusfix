import mongoose from 'mongoose';
import { COMPLAINT_CATEGORIES, COMPLAINT_PRIORITIES, COMPLAINT_STATUSES } from '../models/Complaint.js';

/**
 * Builds a robust MongoDB filter query, sort object, and pagination parameters
 * from standard query parameters.
 *
 * Supported params:
 * - page: number (default 1)
 * - limit: number (default 10)
 * - search: string (matches title, description, location, complaintId)
 * - status: string (e.g. 'IN_PROGRESS', 'all')
 * - priority: string (e.g. 'HIGH', 'Medium', 'all')
 * - category: string (e.g. 'Internet/Wi-Fi', 'all')
 * - startDate: ISO date string / YYYY-MM-DD
 * - endDate: ISO date string / YYYY-MM-DD
 * - dateFilter: preset ('today', 'week', '7days', 'month', '30days', 'year')
 * - sortBy: string field (default 'createdAt') or 'field:dir'
 * - sortOrder: 'asc' | 'desc' (default 'desc')
 * - assignedTo: string ObjectId, 'unassigned', or 'all'
 */
export function buildComplaintQuery(queryParams = {}, baseScope = {}) {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    priority,
    category,
    startDate,
    endDate,
    dateFilter,
    assignedTo,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = queryParams;

  const query = { ...baseScope };

  // 1. Text Search across title, description, location, category, and complaintId
  if (search && typeof search === 'string' && search.trim() !== '') {
    const rawSearch = search.trim();
    const escaped = rawSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Flexible regex for wifi/wi-fi variations
    const flexibleSearch = escaped.replace(/wi[- ]?fi/gi, 'wi[- /]?fi');
    const searchRegex = new RegExp(flexibleSearch, 'i');
    query.$or = [
      { complaintId: searchRegex },
      { title: searchRegex },
      { description: searchRegex },
      { location: searchRegex },
      { category: searchRegex },
    ];
  }

  // 2. Status Filter
  if (status && status !== 'All' && status !== 'all') {
    const cleanStatus = status.trim().toUpperCase();
    if (cleanStatus === 'ACTIVE') {
      query.status = { $in: ['SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED'] };
    } else if (cleanStatus === 'COMPLETED') {
      query.status = { $in: ['RESOLVED', 'VERIFIED', 'CLOSED'] };
    } else {
      const matchedStatus = COMPLAINT_STATUSES.find((s) => s === cleanStatus);
      if (matchedStatus) {
        query.status = matchedStatus;
      } else {
        query.status = { $regex: new RegExp(`^${cleanStatus}$`, 'i') };
      }
    }
  }

  // 3. Priority Filter (handles 'HIGH', 'High', 'critical', etc.)
  if (priority && priority !== 'All' && priority !== 'all') {
    const cleanPriority = priority.trim();
    const matchedPriority = COMPLAINT_PRIORITIES.find(
      (p) => p.toLowerCase() === cleanPriority.toLowerCase()
    );
    if (matchedPriority) {
      query.priority = matchedPriority;
    } else {
      query.priority = { $regex: new RegExp(`^${cleanPriority}$`, 'i') };
    }
  }

  // 4. Category Filter (handles 'Internet/Wi-Fi', 'electrical', etc.)
  if (category && category !== 'All' && category !== 'all') {
    const cleanCategory = category.trim();
    const matchedCategory = COMPLAINT_CATEGORIES.find(
      (c) => c.toLowerCase() === cleanCategory.toLowerCase()
    );
    if (matchedCategory) {
      query.category = matchedCategory;
    } else {
      query.category = { $regex: new RegExp(`^${cleanCategory}$`, 'i') };
    }
  }

  // 5. Assigned Staff Filter
  if (assignedTo && assignedTo !== 'All' && assignedTo !== 'all') {
    if (assignedTo === 'unassigned') {
      query.assignedTo = null;
    } else if (mongoose.Types.ObjectId.isValid(assignedTo)) {
      query.assignedTo = assignedTo;
    }
  }

  // 6. Date Range & Presets Filter
  const dateConditions = {};
  if (startDate) {
    const start = new Date(startDate);
    if (!isNaN(start.getTime())) {
      // Start of the day
      start.setHours(0, 0, 0, 0);
      dateConditions.$gte = start;
    }
  }

  if (endDate) {
    const end = new Date(endDate);
    if (!isNaN(end.getTime())) {
      // End of the day
      end.setHours(23, 59, 59, 999);
      dateConditions.$lte = end;
    }
  }

  if (dateFilter && !startDate && !endDate) {
    const now = new Date();
    if (dateFilter === 'today') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      dateConditions.$gte = todayStart;
    } else if (dateFilter === 'week' || dateFilter === '7days') {
      const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateConditions.$gte = past7;
    } else if (dateFilter === 'month' || dateFilter === '30days') {
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateConditions.$gte = past30;
    } else if (dateFilter === 'year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      dateConditions.$gte = startOfYear;
    }
  }

  if (Object.keys(dateConditions).length > 0) {
    query.createdAt = dateConditions;
  }

  // 7. Sorting
  let sortField = 'createdAt';
  let sortDirection = -1;

  if (typeof sortBy === 'string' && sortBy.includes(':')) {
    const [field, dir] = sortBy.split(':');
    sortField = field || 'createdAt';
    sortDirection = dir?.toLowerCase() === 'asc' ? 1 : -1;
  } else if (typeof sortBy === 'string') {
    sortField = sortBy || 'createdAt';
    sortDirection = String(sortOrder).toLowerCase() === 'asc' ? 1 : -1;
  }

  const sort = { [sortField]: sortDirection };

  // 8. Pagination Math
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  return {
    query,
    sort,
    pageNum,
    limitNum,
    skip,
  };
}

/**
 * Standardized pagination formatter complying with:
 * {
 *   data: [],
 *   pagination: {
 *     page,
 *     limit,
 *     total,
 *     totalPages
 *   }
 * }
 */
export function formatPaginatedResponse(items, totalCount, pageNum, limitNum, extraPayload = {}) {
  const totalPages = Math.ceil(totalCount / limitNum) || 1;

  return {
    success: true,
    data: items,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: totalCount,
      totalPages,
    },
    // Backwards-compatibility for existing tests/components
    complaints: items,
    totalComplaints: totalCount,
    totalPages,
    currentPage: pageNum,
    count: items.length,
    ...extraPayload,
  };
}
