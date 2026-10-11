import moment from 'moment';

export class WeekParityCalculator {
  // 1 вересня 2026 року - перший "чисельник"
  static ACADEMIC_YEAR_START = moment('2026-09-01');

  /**
   * Визначає парність поточного тижня
   * @param {Date|moment} date - дата для перевірки (за замовчуванням - поточна дата)
   * @returns {string} 'first' або 'second'
   */
  static getCurrentWeekParity(date = null) {
    const currentDate = date ? moment(date) : moment();
    const startOfWeek = currentDate.clone().startOf('isoWeek'); // Понеділок

    // Рахуємо кількість тижнів від 1 вересня
    const weekNumber = Math.floor(startOfWeek.diff(this.ACADEMIC_YEAR_START, 'weeks', true));

    // Якщо weekNumber парне - це "second", непарне - "first"
    return weekNumber % 2 === 0 ? 'second' : 'first';
  }

  /**
   * Отримує діапазон дат поточного тижня
   * @param {Date|moment} date - дата для перевірки
   * @returns {object} { start: moment, end: moment, display: string }
   */
  static getCurrentWeekRange(date = null) {
    const currentDate = date ? moment(date) : moment();
    const startOfWeek = currentDate.clone().startOf('isoWeek'); // Понеділок
    const endOfWeek = currentDate.clone().endOf('isoWeek'); // Неділя

    return {
      start: startOfWeek,
      end: endOfWeek,
      display: `${startOfWeek.format('DD.MM.YYYY')} - ${endOfWeek.format('DD.MM.YYYY')}`,
      parity: this.getCurrentWeekParity(date),
      parityDisplay: this.getCurrentWeekParity(date) === 'first' ? 'чисельник' : 'знаменник'
    };
  }

  /**
   * Отримує тижні на період (наприклад, на семестр)
   * @param {number} weeksCount - кількість тижнів
   * @param {Date|moment} startDate - початкова дата
   * @returns {array} Масив об'єктів з інформацією про тижні
   */
  static getWeeksPeriod(weeksCount = 18, startDate = null) {
    const date = startDate ? moment(startDate) : moment(this.ACADEMIC_YEAR_START);
    const weeks = [];

    for (let i = 0; i < weeksCount; i++) {
      const weekStart = date.clone().add(i, 'weeks').startOf('isoWeek');
      const weekEnd = weekStart.clone().endOf('isoWeek');
      const weekNumber = Math.floor(weekStart.diff(this.ACADEMIC_YEAR_START, 'weeks', true));

      weeks.push({
        number: i + 1,
        start: weekStart,
        end: weekEnd,
        display: `${weekStart.format('DD.MM.YYYY')} - ${weekEnd.format('DD.MM.YYYY')}`,
        parity: weekNumber % 2 === 0 ? 'second' : 'first',
        parityDisplay: weekNumber % 2 === 0 ? 'знаменник' : 'чисельник'
      });
    }

    return weeks;
  }
}

export default WeekParityCalculator;
