const Course = require('../models/Course');

const updateCourseStatuses = async () => {
  const now = new Date();

  await Course.updateMany(
    {
      status: 'published',
      startDate: { $lte: now },
      endDate: { $gte: now },
    },
    {
      status: 'em_andamento',
    }
  );

  await Course.updateMany(
    {
      status: { $in: ['published', 'em_andamento'] },
      endDate: { $lt: now },
    },
    {
      status: 'closed',
    }
  );
};

module.exports = {
  updateCourseStatuses,
};