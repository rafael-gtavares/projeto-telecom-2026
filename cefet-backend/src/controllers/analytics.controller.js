const PageView = require('../models/PageView');
const User = require('../models/User');

const PATH_MAX = 200;
const VISITOR_MAX = 64;
const ACTIVE_WINDOW_MS = 5 * 60 * 1000; // "ativos agora" = últimos 5 min
const DAYS_MAP = { '7d': 7, '30d': 30, '90d': 90 };

// POST /analytics/pageview — registra um acesso (público, optionalAuth).
// Best-effort: nunca quebra a navegação do cliente.
const recordPageView = async (req, res) => {
  try {
    let path = String(req.body.path || '').trim();
    if (!path.startsWith('/')) return res.status(204).end(); // ignora rota inválida
    path = path.slice(0, PATH_MAX);

    const visitorId = req.body.visitorId
      ? String(req.body.visitorId).slice(0, VISITOR_MAX)
      : null;

    await PageView.create({
      path,
      user: req.user?.id || null,
      visitorId,
      authenticated: !!req.user,
    });

    res.status(201).json({ success: true });
  } catch {
    res.status(204).end(); // silencioso: analytics não deve afetar o usuário
  }
};

// GET /analytics/access — estatísticas de acesso (somente admin).
const getAccessStats = async (req, res, next) => {
  try {
    const days = DAYS_MAP[req.query.period] || 30;
    const now = new Date();
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const activeSince = new Date(now.getTime() - ACTIVE_WINDOW_MS);

    const [
      totalViews, loggedInViews,
      uniqueVisitors, activeVisitors, activeUsers,
      byDay, topPages, newUsers, totalStudents,
    ] = await Promise.all([
      PageView.countDocuments({ createdAt: { $gte: start } }),
      PageView.countDocuments({ createdAt: { $gte: start }, authenticated: true }),
      PageView.distinct('visitorId', { createdAt: { $gte: start }, visitorId: { $ne: null } }),
      PageView.distinct('visitorId', { createdAt: { $gte: activeSince }, visitorId: { $ne: null } }),
      PageView.distinct('user', { createdAt: { $gte: activeSince }, user: { $ne: null } }),
      PageView.aggregate([
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            total: { $sum: 1 },
            loggedIn: { $sum: { $cond: ['$authenticated', 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      PageView.aggregate([
        { $match: { createdAt: { $gte: start } } },
        { $group: { _id: '$path', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      User.countDocuments({ createdAt: { $gte: start } }),
      User.countDocuments({ role: 'aluno' }),
    ]);

    // Série diária com dias faltantes preenchidos com zero
    const map = new Map(byDay.map((d) => [d._id, d]));
    const series = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      const hit = map.get(key);
      series.push({ date: key, total: hit?.total || 0, loggedIn: hit?.loggedIn || 0 });
    }

    res.json({
      success: true,
      data: {
        period: `${days}d`,
        totalViews,
        uniqueVisitors: uniqueVisitors.length,
        loggedInViews,
        anonymousViews: totalViews - loggedInViews,
        activeNow: activeVisitors.length,
        activeUsersNow: activeUsers.length,
        newUsers,
        totalStudents,
        series,
        topPages: topPages.map((p) => ({ path: p._id, count: p.count })),
      },
    });
  } catch (err) { next(err); }
};

module.exports = { recordPageView, getAccessStats };
