function SkeletonBox({ width = "100%", height = 20, radius = 6, style = {} }) {
  return (
    <div
      className="skeleton-shimmer"
      style={{
        width,
        height,
        borderRadius: radius,
        ...style
      }}
    />
  );
}

function SkeletonDashboard() {
  return (
    <main className="page-container">
      <section className="dashboard-profile-card">
        <SkeletonBox width={64} height={64} radius={32} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <SkeletonBox width="40%" height={20} />
          <SkeletonBox width="60%" height={14} />
          <SkeletonBox width="50%" height={12} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 220 }}>
          <SkeletonBox width="100%" height={32} radius={8} />
          <SkeletonBox width="100%" height={8} radius={4} />
        </div>
      </section>

      <section className="dashboard-stats dashboard-stats-extended">
        {[1, 2, 3, 4].map((i) => (
          <div className="stat-card" key={i}>
            <SkeletonBox width={32} height={32} radius={8} />
            <SkeletonBox width="60%" height={14} />
            <SkeletonBox width="40%" height={28} />
          </div>
        ))}
      </section>

      <section className="dashboard-charts">
        {[1, 2].map((i) => (
          <div className="dashboard-chart-card" key={i}>
            <SkeletonBox width="50%" height={18} />
            <SkeletonBox width="100%" height={220} radius={8} style={{ marginTop: 16 }} />
          </div>
        ))}
      </section>

      <section className="dashboard-activity-feed">
        <SkeletonBox width="30%" height={20} />
        <div className="dashboard-activity-list" style={{ marginTop: 12 }}>
          {[1, 2, 3].map((i) => (
            <div className="dashboard-activity-item" key={i}>
              <SkeletonBox width={38} height={38} radius={10} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <SkeletonBox width="70%" height={14} />
                <SkeletonBox width="30%" height={12} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default SkeletonDashboard;