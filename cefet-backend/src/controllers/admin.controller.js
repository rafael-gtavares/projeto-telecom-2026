const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

const getStats = async (req, res, next) => {
  try {

    // =====================================================
    // MÉTRICAS GERAIS
    // =====================================================
    // Busca:
    // - total de alunos cadastrados
    // - total de cursos publicados
    // - total de inscrições realizadas
    //
    // Promise.all executa todas as consultas ao mesmo tempo,
    // deixando a resposta mais rápida.
    // =====================================================

    const [totalUsers, totalCourses, totalEnrollments] = await Promise.all([
      User.countDocuments({ role: 'aluno' }),
      Course.countDocuments({ status: 'published' }),
      Enrollment.countDocuments(),
    ]);


    // =====================================================
    // OCUPAÇÃO MÉDIA DOS CURSOS
    // =====================================================
    // Calcula a média de ocupação dos cursos publicados.
    //
    // Fórmula:
    // (inscritos / vagas máximas) * 100
    // =====================================================

    const courses = await Course.find(
      { status: 'published' },
      'maxSlots enrolledCount'
    );

    const avgOccupancy = courses.length
      ? Math.round(
          courses.reduce(
            (acc, c) =>
              acc + (c.enrolledCount / c.maxSlots) * 100,
            0
          ) / courses.length
        )
      : 0;


    // =====================================================
    // INSCRIÇÕES DOS ÚLTIMOS 6 MESES
    // =====================================================
    // Cria uma data de referência para buscar apenas
    // inscrições recentes.
    // =====================================================

    const sixMonthsAgo = new Date();

    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);


    // =====================================================
    // AGRUPAMENTO DE INSCRIÇÕES POR MÊS
    // =====================================================
    // Aggregate:
    // - filtra inscrições recentes
    // - agrupa por ano e mês
    // - conta quantas inscrições existem em cada mês
    // =====================================================

    const enrollmentsByMonth = await Enrollment.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
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


    // =====================================================
    // FORMATAÇÃO DOS DADOS DO GRÁFICO
    // =====================================================
    // Transforma os dados do aggregate em um formato
    // mais amigável para o frontend.
    // =====================================================

    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];

    const chartData = enrollmentsByMonth.map(e => ({
      month: months[e._id.month - 1],
      count: e.count,
    }));


    // =====================================================
    // CURSOS RECENTES
    // =====================================================
    // Busca os 5 cursos mais recentes.
    //
    // populate:
    // substitui o id do professor pelos dados do professor.
    // =====================================================

    const recentCourses = await Course.find()
      .populate('professor', 'name')
      .sort({ createdAt: -1 })
      .limit(5);


    // =====================================================
    // ESTATÍSTICAS DE GÊNERO
    // =====================================================
    // Busca todas as inscrições trazendo apenas o campo
    // gender do usuário relacionado à inscrição.
    // =====================================================

    const enrollments = await Enrollment.find()
      .populate('user', 'gender');


    // Estrutura inicial das estatísticas
    const genderStats = {
      masculino: 0,
      feminino: 0,
      prefiro_nao_informar: 0,
    };


    // Percorre todas as inscrições e soma
    // no gênero correspondente
    enrollments.forEach(enrollment => {

      const gender = enrollment.user?.gender;

      // Verifica se o gênero existe no objeto
      // antes de incrementar
      if (genderStats[gender] !== undefined) {
        genderStats[gender]++;
      }
    });


    // =====================================================
    // RESPOSTA FINAL
    // =====================================================

    res.json({
      success: true,

      data: {
        // Métricas gerais
        totalUsers,
        totalCourses,
        totalEnrollments,
        avgOccupancy,

        // Gráfico de inscrições
        enrollmentsByMonth: chartData,

        // Cursos recentes
        recentCourses,

        // Estatísticas demográficas
        genderStats,
      }
    });

  } catch (err) {
    next(err);
  }
};

module.exports = { getStats };