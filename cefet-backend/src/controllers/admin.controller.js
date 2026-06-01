const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const School = require('../models/School');

const getStats = async (req, res, next) => {
  try {
    // =========================
    // MÉTRICAS GERAIS
    // =========================

    const [totalUsers, totalCourses, totalEnrollments] = await Promise.all([
      User.countDocuments({ role: 'aluno' }),
      Course.countDocuments({ status: 'published' }),
      Enrollment.countDocuments(),
    ]);


    // =========================
    // PERÍODO PARA FILTRO
    // =========================
    const { period = '6m' } = req.query;

    const periodMap = {
      '1m': 1,
      '3m': 3,
      '6m': 6,
      '1y': 12
    };

    const monthsBack = periodMap[period] || 6;

    const startDate = new Date();

    startDate.setMonth(startDate.getMonth() - monthsBack);
    startDate.setDate(1);

    const courses = await Course.find(
      { status: 'published' },
      'maxSlots enrolledCount'
    );

    const avgOccupancy = courses.length
      ? Math.round(
        courses.reduce(
          (acc, course) =>
            acc + (course.enrolledCount / course.maxSlots) * 100,
          0
        ) / courses.length
      )
      : 0;

    const enrollmentsByMonth = await Enrollment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },

      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },

          count: { $sum: 1 }
        }
      },

      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1
        }
      },
    ]);

    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];

    const chartData = enrollmentsByMonth.map(item => ({
      month: months[item._id.month - 1],
      count: item.count,
    }));


    // =========================
    // CURSOS RECENTES
    // =========================

    const recentCourses = await Course.find()
      .populate('professor', 'name')
      .sort({ createdAt: -1 })
      .limit(5);


    // =========================
    // ESTATÍSTICAS DE ESCOLAS (apenas alunos)
    // =========================

    const schoolStatsRaw = await User.aggregate([
      {
        $match: {
          role: 'aluno',
        }
      },
      {
        $group: {
          _id: '$school', // null = "Outras"
          count: { $sum: 1 },
        }
      },
    ]);

    // Busca os nomes das escolas para montar o resultado
    const schoolIds = schoolStatsRaw
      .filter(s => s._id !== null)
      .map(s => s._id);

    const schoolNames = await School.find(
      { _id: { $in: schoolIds } },
      'name'
    );

    const schoolNamesMap = {};
    schoolNames.forEach(s => {
      schoolNamesMap[s._id.toString()] = s.name;
    });

    const schoolStats = schoolStatsRaw.map(s => ({
      name: s._id ? (schoolNamesMap[s._id.toString()] || 'Desconhecida') : 'Outras',
      count: s.count,
    }));


    // =========================
    // ESTATÍSTICAS DEMOGRÁFICAS
    // =========================

    const enrollments = await Enrollment.find({
      createdAt: { $gte: startDate }
    })
      .populate({
        path: 'user',
        select: 'gender schoolLevel incomeRange birthDate'
      });

    const genderStats = {
      masculino: 0,
      feminino: 0,
      prefiro_nao_informar: 0,
    };

    const schoolLevelStats = {
      ensino_fundamental: 0,
      '1_ou_2_ano_em': 0,
      ultimo_ano_em: 0,
      ensino_medio_finalizado: 0,
      eja: 0
    };

    const incomeRangeStats = {
      ate_1sm: 0,
      '1_a_2sm': 0,
      '2_a_3sm': 0,
      '3_a_5sm': 0,
      acima_5sm: 0,
      prefiro_nao_informar: 0
    };

    const ageStats = {
      ate_14: 0,
      de_15_a_17: 0,
      de_18_a_21: 0,
      de_22_a_25: 0,
      acima_de_25: 0
    };


    // =========================
    // PROCESSAMENTO DAS ESTATÍSTICAS
    // =========================

    enrollments.forEach(enrollment => {

      const user = enrollment.user;

      const gender = user?.gender;
      const schoolLevel = user?.schoolLevel;
      const incomeRange = user?.incomeRange;
      const birthDate = user?.birthDate;


      // Gênero
      if (genderStats[gender] !== undefined) {
        genderStats[gender]++;
      }


      // Escolaridade
      if (schoolLevelStats[schoolLevel] !== undefined) {
        schoolLevelStats[schoolLevel]++;
      }


      // Faixa de renda
      if (incomeRangeStats[incomeRange] !== undefined) {
        incomeRangeStats[incomeRange]++;
      }


      // Idade
      if (birthDate) {

        const today = new Date();
        const birth = new Date(birthDate);

        let age = today.getFullYear() - birth.getFullYear();

        const monthDiff = today.getMonth() - birth.getMonth();

        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birth.getDate())
        ) {
          age--;
        }

        if (age <= 14) {
          ageStats.ate_14++;
        }

        else if (age <= 17) {
          ageStats.de_15_a_17++;
        }

        else if (age <= 21) {
          ageStats.de_18_a_21++;
        }

        else if (age <= 25) {
          ageStats.de_22_a_25++;
        }

        else {
          ageStats.acima_de_25++;
        }
      }
    });


    // =========================
    // RESPOSTA
    // =========================

    res.json({
      success: true,

      data: {
        totalUsers,
        totalCourses,
        totalEnrollments,
        avgOccupancy,

        enrollmentsByMonth: chartData,

        recentCourses,

        genderStats,
        schoolLevelStats,
        incomeRangeStats,
        ageStats,
        schoolStats,
      }
    });

  } catch (err) {
    next(err);
  }
};

module.exports = { getStats };