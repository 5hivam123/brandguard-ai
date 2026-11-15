const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      let errorMsg = `HTTP Error ${res.status}`;
      try {
        const errData = await res.json();
        errorMsg = errData.detail || errData.error || errorMsg;
      } catch (e) {
        // non-json response
      }
      throw new Error(errorMsg);
    }
    if (res.status === 204) return null;
    return await res.json();
  } catch (err) {
    console.error(`API request failed: ${url}`, err);
    throw err;
  }
}

export const api = {
  // Health
  getHealth: () => request('/api/health'),

  // Dashboard Stats
  getDashboardStats: () => request('/api/dashboard/stats'),

  // Brands
  getBrands: () => request('/api/brands'),
  getBrand: (brandId) => request(`/api/brands/${brandId}`),
  createBrand: (data) => request('/api/brands', { method: 'POST', body: JSON.stringify(data) }),
  updateBrand: (brandId, data) => request(`/api/brands/${brandId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBrand: (brandId) => request(`/api/brands/${brandId}`, { method: 'DELETE' }),
  seedBrands: () => request('/api/brands/seed', { method: 'POST' }),

  // Sub-items
  addGuideline: (brandId, data) => request(`/api/brands/${brandId}/guidelines`, { method: 'POST', body: JSON.stringify(data) }),
  deleteGuideline: (brandId, id) => request(`/api/brands/${brandId}/guidelines/${id}`, { method: 'DELETE' }),

  addFact: (brandId, data) => request(`/api/brands/${brandId}/facts`, { method: 'POST', body: JSON.stringify(data) }),
  deleteFact: (brandId, id) => request(`/api/brands/${brandId}/facts/${id}`, { method: 'DELETE' }),

  addProhibitedTerm: (brandId, data) => request(`/api/brands/${brandId}/prohibited-terms`, { method: 'POST', body: JSON.stringify(data) }),
  deleteProhibitedTerm: (brandId, id) => request(`/api/brands/${brandId}/prohibited-terms/${id}`, { method: 'DELETE' }),

  // Reviews
  submitReview: (data) => request('/api/reviews', { method: 'POST', body: JSON.stringify(data) }),
  getReviews: (params = {}) => {
    const search = new URLSearchParams();
    if (params.brand_id) search.append('brand_id', params.brand_id);
    if (params.status) search.append('status', params.status);
    if (params.limit) search.append('limit', params.limit);
    const qs = search.toString();
    return request(`/api/reviews${qs ? `?${qs}` : ''}`);
  },
  getReview: (reviewId) => request(`/api/reviews/${reviewId}`),
  updateReviewStatus: (reviewId, status) => request(`/api/reviews/${reviewId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),
  applySuggestion: (reviewId, issueId, action) => request(`/api/reviews/${reviewId}/apply-suggestion`, {
    method: 'POST',
    body: JSON.stringify({ issue_id: issueId, action })
  }),
  updateRevisedContent: (reviewId, revisedContent) => request(`/api/reviews/${reviewId}/content`, {
    method: 'PUT',
    body: JSON.stringify({ revised_content: revisedContent })
  }),
  deleteReview: (reviewId) => request(`/api/reviews/${reviewId}`, { method: 'DELETE' }),
};
