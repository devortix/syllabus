<template>
  <div id="app" class="app">
    <!-- Custom Navbar -->
    <div class="navbar">
      <div class="navbar-left">
        <span class="navbar-text" @click="handleSelectClick">Обрати</span>
      </div>
      <div class="navbar-center">
        <span class="navbar-title">Розклад</span>
      </div>
      <div class="navbar-right">
        <van-icon name="question-o" size="24" @click="showInfo = true" />
      </div>
    </div>

    <!-- Info Dialog -->
    <van-dialog
      v-model:show="showInfo"
      title="Інформація"
      show-cancel-button
      @confirm="showInfo = false"
    >
      <div class="info-content">
        <h3>Розклад занять</h3>
        <p>Приложение для перегляду розкладу занять</p>
        <hr />
        <h4>Контакти:</h4>
        <p>
          📧 Email: <strong>info@university.edu</strong><br />
          📞 Tel: <strong>+38 (0) XX XXX-XX-XX</strong><br />
          🌐 Web: <strong>www.university.edu</strong>
        </p>
      </div>
    </van-dialog>

    <!-- Main Content -->
    <div class="app-content">
      <ScheduleView 
        v-if="selectedFilters"
        :filters="selectedFilters"
      />
      <div v-else class="empty-state">
        <p>Оберіть розклад для перегляду</p>
        <van-button 
          plain 
          type="primary" 
          size="large"
          @click="handleSelectClick"
          style="margin-top: 20px; color: #1989fa; border: none;"
        >
          обрати
        </van-button>
      </div>
    </div>

    <!-- Year Selection ActionSheet -->
    <van-action-sheet
      v-model:show="showYearSheet"
      title="Оберіть рік навчання"
      :actions="yearActions"
      cancel-text=""
      @select="onYearSelect"
    />

    <!-- Faculty Selection ActionSheet -->
    <van-action-sheet
      v-model:show="showFacultySheet"
      :title="`Оберіть факультет (${selectedYear})`"
      :actions="facultyActions"
      :cancel-text="`< ${selectedYear}`"
      @select="onFacultySelect"
      @cancel="goBack('faculty')"
    />

    <!-- Course Selection ActionSheet -->
    <van-action-sheet
      v-model:show="showCourseSheet"
      :title="`Оберіть курс (${getFacultyTitle(selectedFaculty)})`"
      :actions="courseActions"
      :cancel-text="`< ${getFacultyTitle(selectedFaculty)}`"
      @select="onCourseSelect"
      @cancel="goBack('course')"
    />

    <!-- Group Selection ActionSheet -->
    <van-action-sheet
      v-model:show="showGroupSheet"
      :title="`Оберіть спеціальність (${getCourseTitle(selectedCourse)})`"
      :actions="groupActions"
      :cancel-text="`< ${getCourseTitle(selectedCourse)}`"
      @select="onGroupSelect"
      @cancel="goBack('group')"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Dialog, Icon, Button, ActionSheet, Toast } from 'vant';
import ScheduleView from '@/components/ScheduleView.vue';
import scheduleRepository from '@/services/scheduleRepository.js';

const showInfo = ref(false);
const selectedFilters = ref(null);

// Filter selector state
const allFilters = ref([]);
const showYearSheet = ref(false);
const showFacultySheet = ref(false);
const showCourseSheet = ref(false);
const showGroupSheet = ref(false);

const selectedYear = ref(null);
const selectedFaculty = ref(null);
const selectedCourse = ref(null);
const selectedGroup = ref(null);

const availableYears = [2026, 2027];

// Computed properties
const yearActions = computed(() => {
  return availableYears.map(year => ({
    name: year.toString(),
    value: year
  }));
});

const faculties = computed(() => {
  if (!selectedYear.value) return [];
  return allFilters.value;
});

const facultyActions = computed(() => {
  return faculties.value.map(faculty => ({
    name: faculty.title,
    value: faculty.code
  }));
});

const courses = computed(() => {
  if (!selectedFaculty.value) return [];
  const faculty = faculties.value.find(f => f.code === selectedFaculty.value);
  return faculty ? faculty.data : [];
});

const courseActions = computed(() => {
  return courses.value.map(course => ({
    name: course.title,
    value: course.code
  }));
});

const groups = computed(() => {
  if (!selectedCourse.value) return [];
  const course = courses.value.find(c => c.code === selectedCourse.value);
  return course ? course.data : [];
});

const groupActions = computed(() => {
  return groups.value.map(group => ({
    name: group.title,
    value: group.code
  }));
});

// Methods
const loadFilters = async () => {
  try {
    const filters = await scheduleRepository.getFilters(2026);
    allFilters.value = filters;
  } catch (error) {
    Toast.fail('Не вдалося завантажити фільтри');
    console.error(error);
  }
};

const getFacultyTitle = (code) => {
  const faculty = faculties.value.find(f => f.code === code);
  return faculty ? faculty.title : '';
};

const getCourseTitle = (code) => {
  const course = courses.value.find(c => c.code === code);
  return course ? course.title : '';
};

const handleSelectClick = () => {
  showYearSheet.value = true;
};

const onYearSelect = (action) => {
  selectedYear.value = action.value;
  showYearSheet.value = false;
  showFacultySheet.value = true;
};

const onFacultySelect = (action) => {
  selectedFaculty.value = action.value;
  showFacultySheet.value = false;
  showCourseSheet.value = true;
};

const onCourseSelect = (action) => {
  selectedCourse.value = action.value;
  showCourseSheet.value = false;
  showGroupSheet.value = true;
};

const onGroupSelect = (action) => {
  selectedGroup.value = action.value;
  showGroupSheet.value = false;
  
  selectedFilters.value = {
    year: selectedYear.value,
    faculty: selectedFaculty.value,
    course: selectedCourse.value,
    group: selectedGroup.value
  };
  
  resetSelection();
};

const goBack = (level) => {
  if (level === 'faculty') {
    selectedFaculty.value = null;
    selectedCourse.value = null;
    selectedGroup.value = null;
    showFacultySheet.value = false;
    showYearSheet.value = true;
  } else if (level === 'course') {
    selectedCourse.value = null;
    selectedGroup.value = null;
    showCourseSheet.value = false;
    showFacultySheet.value = true;
  } else if (level === 'group') {
    selectedGroup.value = null;
    showGroupSheet.value = false;
    showCourseSheet.value = true;
  }
};

const resetSelection = () => {
  selectedYear.value = null;
  selectedFaculty.value = null;
  selectedCourse.value = null;
  selectedGroup.value = null;
};

const parseStartAppParam = async () => {
  const params = new URLSearchParams(window.location.search);
  const startapp = params.get('startapp');
  
  if (!startapp) return;
  
  const parts = startapp.split(',');
  if (parts.length !== 4) return;
  
  const [year, faculty, course, group] = parts;
  
  // Validate year
  if (!availableYears.includes(parseInt(year))) return;
  
  // Find faculty in filters
  const facultyObj = allFilters.value.find(f => f.code === faculty);
  if (!facultyObj) return;
  
  // Find course in faculty
  const courseObj = facultyObj.data.find(c => c.code === course);
  if (!courseObj) return;
  
  // Find group in course
  const groupObj = courseObj.data.find(g => g.code === group);
  if (!groupObj) return;
  
  // All valid, set filters
  selectedFilters.value = {
    year: parseInt(year),
    faculty,
    course,
    group
  };
};

onMounted(async () => {
  await loadFilters();
  await parseStartAppParam();
});
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 56px;
  background: #1989fa;
  color: white;
  padding: 0 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.navbar-left,
.navbar-right {
  flex: 1;
  display: flex;
  align-items: center;
}

.navbar-left {
  justify-content: flex-start;
}

.navbar-right {
  justify-content: flex-end;
  cursor: pointer;
}

.navbar-center {
  flex: 2;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
}

.navbar-text {
  font-size: 16px;
  cursor: pointer;
  padding: 8px 16px;
}

.navbar-text:active {
  opacity: 0.7;
}

.app-content {
  flex: 1;
  overflow-y: auto;
  padding-top: 0;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-size: 16px;
}

.info-content {
  padding: 16px 0;
  text-align: left;
}

.info-content h3 {
  margin: 16px 0 8px;
  font-size: 18px;
  color: #333;
}

.info-content h4 {
  margin: 12px 0 8px;
  font-size: 14px;
  color: #666;
}

.info-content p {
  margin: 8px 0;
  font-size: 13px;
  color: #666;
  line-height: 1.6;
}

.info-content hr {
  margin: 12px 0;
  border: none;
  border-top: 1px solid #e0e0e0;
}
</style>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  width: 100%;
  height: 100%;
}

.app {
  background: #f5f5f5;
  height: 100%;
}
</style>
