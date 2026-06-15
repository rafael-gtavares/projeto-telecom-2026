const Lesson = require('../models/Lesson');

const LESSON_MODALITY = {
  presencial: 'presencial',
  ead: 'online',
  online: 'online',
  semi_presencial: 'hibrido',
  hibrido: 'hibrido',
  palestra: 'presencial',
  workshop: 'presencial',
  outro: 'presencial',
};
const toLessonModality = (m) => LESSON_MODALITY[m] || 'presencial';

const validateSchedule = ({
  scheduleType,
  scheduleConfig = [],
  startDate,
  endDate,
}) => {
  if (!scheduleType) {
    throw new Error('scheduleType é obrigatório');
  }

  if (!Array.isArray(scheduleConfig) || scheduleConfig.length === 0) {
    throw new Error('scheduleConfig é obrigatório');
  }

  if (scheduleType === 'single') {
    const lesson = scheduleConfig[0];

    if (!lesson?.date) {
      throw new Error('Data da aula é obrigatória');
    }

    if (!lesson?.startTime || !lesson?.endTime) {
      throw new Error('Horário da aula é obrigatório');
    }

    if (lesson.startTime >= lesson.endTime) {
      throw new Error('O horário de início deve ser anterior ao de término');
    }

    return;
  }

  if (scheduleType === 'weekly') {
    if (!startDate || !endDate) {
      throw new Error(
        'Data inicial e final são obrigatórias'
      );
    }

    scheduleConfig.forEach(item => {
      if (
        item.weekday === undefined ||
        item.weekday === null
      ) {
        throw new Error(
          'Todos os dias da semana devem ser informados'
        );
      }

      if (!item.startTime || !item.endTime) {
        throw new Error(
          'Todos os horários devem ser informados'
        );
      }

      if (item.startTime >= item.endTime) {
        throw new Error(
          'O horário de início deve ser anterior ao de término'
        );
      }
    });

    return;
  }

  if (scheduleType === 'custom') {
    scheduleConfig.forEach(item => {
      if (!item.date) {
        throw new Error(
          'Todas as datas devem ser informadas'
        );
      }

      if (!item.startTime || !item.endTime) {
        throw new Error(
          'Todos os horários devem ser informados'
        );
      }

      if (item.startTime >= item.endTime) {
        throw new Error(
          'O horário de início deve ser anterior ao de término'
        );
      }
    });

    return;
  }

  throw new Error('Tipo de agenda inválido');
};

const getCoursePeriod = ({
  scheduleType,
  scheduleConfig = [],
  startDate,
  endDate,
}) => {
  if (scheduleType === 'single') {
    const lessonDate = new Date(
      scheduleConfig[0].date
    );

    return {
      startDate: lessonDate,
      endDate: lessonDate,
    };
  }

  if (scheduleType === 'weekly') {
    return {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };
  }

  if (scheduleType === 'custom') {
    const sortedDates = scheduleConfig
      .map(item => new Date(item.date))
      .sort((a, b) => a - b);

    return {
      startDate: sortedDates[0],
      endDate:
        sortedDates[sortedDates.length - 1],
    };
  }

  throw new Error('Tipo de agenda inválido');
};

// Monta (sem inserir) a lista de aulas que o cronograma deve ter.
const buildLessons = ({
  courseId,
  scheduleType,
  scheduleConfig = [],
  startDate,
  endDate,
  modality,
  location,
  createdBy,
}) => {
  const lessons = [];
  const lessonModality = toLessonModality(modality);

  if (scheduleType === 'single') {
    const lesson = scheduleConfig[0];

    lessons.push({
      course: courseId,
      title: 'Aula 1',
      date: new Date(lesson.date),
      startTime: lesson.startTime,
      endTime: lesson.endTime,
      modality: lessonModality,
      location,
      createdBy,
    });
  }

  if (scheduleType === 'custom') {
    scheduleConfig.forEach((lesson, index) => {
      lessons.push({
        course: courseId,
        title: `Aula ${index + 1}`,
        date: new Date(lesson.date),
        startTime: lesson.startTime,
        endTime: lesson.endTime,
        modality: lessonModality,
        location,
        createdBy,
      });
    });
  }

  if (scheduleType === 'weekly') {
    const current = new Date(startDate);
    const finalDate = new Date(endDate);

    let lessonNumber = 1;

    while (current <= finalDate) {
      const weekday = current.getUTCDay();

      const schedule = scheduleConfig.find(
        item => item.weekday === weekday
      );

      if (schedule) {
        lessons.push({
          course: courseId,
          title: `Aula ${lessonNumber++}`,
          date: new Date(current),
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          modality: lessonModality,
          location,
          createdBy,
        });
      }

      current.setUTCDate(current.getUTCDate() + 1);
    }
  }

  return lessons;
};

// Gera (e insere) as aulas do cronograma — usado na criação do curso.
const generateLessons = async (params) => {
  const lessons = buildLessons(params);
  if (lessons.length > 0) {
    await Lesson.insertMany(lessons);
  }
  return lessons;
};

module.exports = {
  validateSchedule,
  getCoursePeriod,
  buildLessons,
  generateLessons,
};