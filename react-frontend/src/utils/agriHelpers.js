/**
 * AgriPulse AI - Specialized Agritech Utility Helpers
 * Formats currencies, weights, dates, and calculates trend badges for outdoor sunlight legibility.
 */

// Format currency into Indian Rupees format (e.g. ₹2,500)
export function formatINR(value) {
  if (value === null || value === undefined || isNaN(value)) return '₹0';
  const num = Number(value);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

// Format volume/weights (e.g. "120 Quintals" or "12.0 Tons")
export function formatWeight(quintals) {
  if (quintals === null || quintals === undefined || isNaN(quintals)) return '0 Qtl';
  const q = Number(quintals);
  if (q >= 100) {
    return `${(q / 10).toFixed(1)} Tons (${q} Qtl)`;
  }
  return `${q} Quintals`;
}

// Relative time formatting (e.g. "5 mins ago", "Just now")
export function formatRelativeTime(dateInput) {
  if (!dateInput) return 'Just now';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Recently';

  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 30) return 'Just now';
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  
  const diffInMins = Math.floor(diffInSeconds / 60);
  if (diffInMins < 60) return `${diffInMins}m ago`;
  
  const diffInHours = Math.floor(diffInMins / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

// Get high-contrast badge metadata for price trend predictions
export function getTrendBadge(prediction, confidence) {
  const isUp = (prediction || '').toUpperCase() === 'UP';
  const confNum = Number(confidence || 0);

  return {
    isUp,
    label: isUp ? 'BULLISH SPIKE' : 'BEARISH SURPLUS',
    directionText: isUp ? 'Price Expected to Rise' : 'Price Expected to Drop',
    color: isUp ? '#059669' : '#dc2626',
    bg: isUp ? 'rgba(5, 150, 105, 0.12)' : 'rgba(220, 38, 38, 0.12)',
    border: isUp ? 'rgba(5, 150, 105, 0.35)' : 'rgba(220, 38, 38, 0.35)',
    icon: isUp ? 'trending_up' : 'trending_down',
    confidenceText: `${confNum.toFixed(1)}% Confidence`,
  };
}

// Crop label lookup helper
export const CROP_LABEL_MAP = {
  wheat: 'Wheat (Premium)',
  rice: 'Basmati Rice',
  corn: 'Yellow Corn',
  cotton: 'Shankar-6 Cotton',
  soybean: 'Soybean Yellow',
  sugarcane: 'Sugarcane Raw',
  mustard: 'Mustard Seed',
  groundnut: 'Groundnut Bold',
  turmeric: 'Salem Turmeric',
  chilli: 'Guntur Chilli Red',
};

export function getCropDisplayName(cropKey) {
  if (!cropKey) return 'Commodity';
  const key = cropKey.toLowerCase();
  return CROP_LABEL_MAP[key] || cropKey.charAt(0).toUpperCase() + cropKey.slice(1);
}
