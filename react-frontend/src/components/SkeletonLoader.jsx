import React from 'react';

/**
 * ════════════════════════════════════════════════════════════
 * FILE: SkeletonLoader.jsx
 * WHERE IT IS: react-frontend/src/components/SkeletonLoader.jsx
 * WHAT IT DOES: High-performance CSS Shimmer Skeleton Loading UI library.
 *               Provides placeholder pulse animation components for cards,
 *               charts, tables, and full page routes during lazy-loading.
 * ════════════════════════════════════════════════════════════
 */

export const Skeleton = ({ width = '100%', height = '20px', borderRadius = '8px', className = '', style = {} }) => (
  <div
    className={`skeleton-shimmer ${className}`}
    style={{
      width,
      height,
      borderRadius,
      background: 'linear-gradient(90deg, var(--clr-surface-container-low) 25%, var(--clr-surface-container-high) 50%, var(--clr-surface-container-low) 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeletonShimmer 1.5s infinite linear',
      ...style
    }}
  />
);

export const SkeletonCard = ({ height = '180px' }) => (
  <div
    className="card"
    style={{
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      height
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Skeleton width="40%" height="16px" borderRadius="6px" />
      <Skeleton width="24px" height="24px" borderRadius="50%" />
    </div>
    <Skeleton width="70%" height="28px" borderRadius="8px" />
    <Skeleton width="50%" height="14px" borderRadius="6px" />
    <div style={{ marginTop: 'auto' }}>
      <Skeleton width="100%" height="36px" borderRadius="10px" />
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
      <Skeleton width="30%" height="22px" borderRadius="6px" />
      <Skeleton width="20%" height="22px" borderRadius="6px" />
    </div>
    {Array.from({ length: rows }).map((_, idx) => (
      <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <Skeleton width="25%" height="16px" />
        <Skeleton width="20%" height="16px" />
        <Skeleton width="20%" height="16px" />
        <Skeleton width="15%" height="16px" />
        <Skeleton width="20%" height="16px" />
      </div>
    ))}
  </div>
);

export const SkeletonChart = () => (
  <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Skeleton width="35%" height="24px" />
      <Skeleton width="25%" height="20px" />
    </div>
    <Skeleton width="100%" height="240px" borderRadius="12px" />
  </div>
);

export const PageSkeleton = () => (
  <div style={{ padding: '24px 16px 60px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
    {/* Header Skeleton */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '280px' }}>
        <Skeleton width="100%" height="32px" />
        <Skeleton width="70%" height="16px" />
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        <Skeleton width="110px" height="40px" borderRadius="10px" />
        <Skeleton width="140px" height="40px" borderRadius="10px" />
      </div>
    </div>

    {/* Metric Cards Skeleton Grid */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
      <SkeletonCard height="140px" />
      <SkeletonCard height="140px" />
      <SkeletonCard height="140px" />
    </div>

    {/* Main Content Chart Skeleton */}
    <SkeletonChart />
  </div>
);

export default Skeleton;
