class ScheduleRepository {
  async getFilters(year) {
    try {
      const response = await fetch(`/data/${year}/filters.json`);
      if (!response.ok) throw new Error(`Failed to load filters for year ${year}`);
      return await response.json();
    } catch (error) {
      console.error('Error loading filters:', error);
      throw error;
    }
  }

  async getSchedule(year, faculty, course, group) {
    try {
      const path = `/data/${year}/${faculty}/${course}/${group}.json`;
      const response = await fetch(path);
      if (!response.ok) throw new Error(`Failed to load schedule from ${path}`);
      return await response.json();
    } catch (error) {
      console.error('Error loading schedule:', error);
      throw error;
    }
  }
}

export default new ScheduleRepository();
