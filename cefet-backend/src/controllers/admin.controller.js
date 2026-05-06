const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

const getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalCourses, totalEnrollments] = await Promise.all([
      User.countDocuments({ role: 'aluno' }),
      Course.countDocuments({ status: 'published' }),
      Enrollment.countDocuments(),
    ]);

    const courses = await Course.find({ status: 'published' }, 'maxSlots enrolledCount');
    const avgOccupancy = courses.length
      ? Math.round(courses.reduce((acc, c) => acc + (c.enrolledCount / c.maxSlots) * 100, 0) / courses.length)
      : 0;

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const enrollmentsByMonth = await Enrollment.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const chartData = enrollmentsByMonth.map(e => ({
      month: months[e._id.month - 1],
      count: e.count,
    }));

    const recentCourses = await Course.find()
      .populate('professor', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: { totalUsers, totalCourses, totalEnrollments, avgOccupancy, enrollmentsByMonth: chartData, recentCourses },
    });
  } catch (err) { next(err); }
};

module.exports = { getStats };
