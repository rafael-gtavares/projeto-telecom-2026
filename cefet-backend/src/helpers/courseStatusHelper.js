const Course = require('../models/Course');


const getCourseStatus = ({
  status,
  startDate,
  endDate,
}) => {
  if (status === 'draft') {
    return 'draft';
  }

  const now = new Date();

  if (now < startDate) {
    return 'published';
  }

  if (now > endDate) {
    return 'closed';
  }

  return 'em_andamento';
};

const updateCourseStatus = async () => {
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
  updateCourseStatus,
  getCourseStatus
};